import prisma from "@/lib/db/client";
import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";
import { buildJobAnalysisPrompt, validateAnalysisResult } from "@/lib/ai/prompts/job-analysis";
import { validateMatchResult } from "@/lib/ai/safety";
import { evaluateJobPreFilters } from "@/lib/jobs/filter";
import { getCached, setCached, buildJobAnalysisCacheKey } from "@/lib/redis/cache";
import type { AIMatchResult } from "@/types/ai";
import type { ResumeData } from "@/types/resume";
import type { Job, Profile, Skill } from "@prisma/client";

export async function analyzeJobCompatibility(jobId: string, userId: string): Promise<{
  success: boolean;
  result?: AIMatchResult;
  isFiltered?: boolean;
  filterReason?: string;
  error?: string;
}> {
  // 1. Fetch Job
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  // 2. Fetch User Profile & Active Resume
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: true,
      education: true,
      targetCompanies: true,
    },
  });

  const activeResume = await prisma.resume.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // 3. Run Deterministic Pre-Filtering
  const preFilter = evaluateJobPreFilters(job, profile);
  if (preFilter.isFiltered) {
    // Update job as filtered
    await prisma.job.update({
      where: { id: jobId },
      data: {
        isFiltered: true,
        filterReason: preFilter.filterReason,
        matchScore: 30,
        matchCategory: "POOR",
        jobStatus: "SKIPPED",
        isSkipped: true,
      },
    });

    return {
      success: true,
      isFiltered: true,
      filterReason: preFilter.filterReason,
    };
  }

  // 4. Check Redis Cache
  const profileVersion = profile ? `${profile.skills.length}_${profile.updatedAt.getTime()}` : "default";
  const cacheKey = job.contentHash ? buildJobAnalysisCacheKey(job.contentHash, profileVersion) : null;

  if (cacheKey) {
    const cachedResult = await getCached<AIMatchResult>(cacheKey);
    if (cachedResult) {
      // Save cached result to DB if not present
      await saveAnalysisToDb(jobId, cachedResult, "cache-hit", 0, 0, 0);
      return { success: true, result: cachedResult };
    }
  }

  // 5. Run AI Analysis via OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-openai-api-key") {
    // If no OpenAI key, generate a deterministic fallback score based on keyword overlap
    const fallbackResult = generateDeterministicAnalysis(job, profile);
    await saveAnalysisToDb(jobId, fallbackResult, "deterministic-fallback", 0, 0, 0);
    return { success: true, result: fallbackResult };
  }

  try {
    const resumeData: ResumeData | null = activeResume ? {
      skills: (activeResume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] },
      experience: (activeResume.experience as unknown as ResumeData["experience"]) || [],
      projects: (activeResume.projects as unknown as ResumeData["projects"]) || [],
      education: (activeResume.education as unknown as ResumeData["education"]) || [],
      certifications: (activeResume.certifications as unknown as ResumeData["certifications"]) || [],
      achievements: (activeResume.achievements as unknown as string[]) || [],
    } : null;

    const prompt = buildJobAnalysisPrompt({ job, profile, resumeData });
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: AI_MODELS.ANALYSIS,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI analysis");

    const parsed = JSON.parse(content);
    let analysisResult = validateAnalysisResult(parsed);

    // 6. AI Safety Guard: Validate strengths against real profile skills
    if (profile?.skills && profile.skills.length > 0) {
      analysisResult = validateMatchResult(analysisResult, {
        names: profile.skills.map((s) => s.name),
      });
    }

    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const costUsd = (promptTokens / 1_000_000) * 2.50 + (completionTokens / 1_000_000) * 10.00;

    // 7. Save to Cache & DB
    if (cacheKey) {
      await setCached(cacheKey, analysisResult);
    }

    await saveAnalysisToDb(jobId, analysisResult, AI_MODELS.ANALYSIS, promptTokens, completionTokens, costUsd);

    return { success: true, result: analysisResult };
  } catch (err: unknown) {
    console.error("[Job Analysis Error]", err);
    // Fallback to deterministic on error
    const fallbackResult = generateDeterministicAnalysis(job, profile);
    await saveAnalysisToDb(jobId, fallbackResult, "error-fallback", 0, 0, 0);
    return { success: true, result: fallbackResult };
  }
}

async function saveAnalysisToDb(
  jobId: string,
  result: AIMatchResult,
  modelUsed: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number
) {
  await prisma.$transaction([
    prisma.aIAnalysis.upsert({
      where: { jobId },
      create: {
        jobId,
        matchScore: result.matchScore,
        recommendation: result.recommendation,
        confidence: result.confidence,
        category: result.category,
        strengths: result.strengths,
        concerns: result.concerns,
        missingSkills: result.missingSkills,
        matchedRequirements: result.matchedRequirements,
        unmatchedRequirements: result.unmatchedRequirements,
        whyApply: result.whyApply ?? null,
        technicalScore: result.scores.technical,
        experienceScore: result.scores.experience,
        roleScore: result.scores.role,
        locationScore: result.scores.location,
        salaryScore: result.scores.salary,
        employmentScore: result.scores.employmentType,
        growthScore: result.scores.careerGrowth,
        modelUsed,
        promptTokens,
        completionTokens,
        costUsd,
      },
      update: {
        matchScore: result.matchScore,
        recommendation: result.recommendation,
        confidence: result.confidence,
        category: result.category,
        strengths: result.strengths,
        concerns: result.concerns,
        missingSkills: result.missingSkills,
        matchedRequirements: result.matchedRequirements,
        unmatchedRequirements: result.unmatchedRequirements,
        whyApply: result.whyApply ?? null,
        technicalScore: result.scores.technical,
        experienceScore: result.scores.experience,
        roleScore: result.scores.role,
        locationScore: result.scores.location,
        salaryScore: result.scores.salary,
        employmentScore: result.scores.employmentType,
        growthScore: result.scores.careerGrowth,
        modelUsed,
        promptTokens,
        completionTokens,
        costUsd,
      },
    }),
    prisma.job.update({
      where: { id: jobId },
      data: {
        matchScore: result.matchScore,
        matchCategory: result.category,
        jobStatus: "ANALYZED",
        aiAnalyzedAt: new Date(),
      },
    }),
  ]);
}

function generateDeterministicAnalysis(
  job: Pick<Job, "title" | "requiredSkills" | "preferredSkills">,
  profile: (Profile & { skills: Skill[] }) | null
): AIMatchResult {
  const profileSkills = profile?.skills?.map((s: Skill) => s.name.toLowerCase()) || [];
  const reqSkills = job.requiredSkills || [];

  const matched: string[] = [];
  const missing: string[] = [];

  for (const s of reqSkills) {
    if (profileSkills.some((p: string) => p.includes(s.toLowerCase()) || s.toLowerCase().includes(p))) {
      matched.push(s);
    } else {
      missing.push(s);
    }
  }

  const skillMatchPct = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 75;
  const score = Math.min(95, Math.max(50, skillMatchPct));

  return {
    matchScore: score,
    recommendation: score >= 75 ? "APPLY" : score >= 60 ? "CONSIDER" : "SKIP",
    confidence: 0.7,
    category: score >= 90 ? "EXCELLENT" : score >= 80 ? "STRONG" : score >= 70 ? "GOOD" : score >= 60 ? "WEAK" : "POOR",
    scores: {
      technical: skillMatchPct,
      experience: 75,
      role: 80,
      location: 80,
      salary: 75,
      employmentType: 90,
      careerGrowth: 75,
    },
    strengths: matched.map((s) => `Matched skill: ${s}`),
    missingSkills: missing,
    concerns: missing.length > 2 ? ["Multiple required technologies not found in profile skills."] : [],
    matchedRequirements: matched,
    unmatchedRequirements: missing,
    whyApply: `Skill alignment is approximately ${score}%. ${matched.length} key required technologies found in your profile.`,
  };
}