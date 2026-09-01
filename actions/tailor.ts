"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { tailorResumeWithAI } from "@/lib/ai/tailor-resume";
import type { ResumeData } from "@/types/resume";
import type { ActionResult } from "./auth";

export type { ActionResult };

export async function tailorResumeAction(
  jobId: string,
  focusAreas?: string[]
): Promise<ActionResult & { tailoredResume?: ResumeData }> {
  const userId = await getRequiredUserId();

  const [job, activeResume] = await Promise.all([
    prisma.job.findFirst({ where: { id: jobId, userId } }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!job) return { success: false, error: "Job not found" };
  if (!activeResume) {
    return {
      success: false,
      error: "No active resume found. Please upload your master resume first.",
    };
  }

  const masterResume: ResumeData = {
    summary: activeResume.summary ?? undefined,
    skills: (activeResume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] },
    experience: (activeResume.experience as unknown as ResumeData["experience"]) || [],
    projects: (activeResume.projects as unknown as ResumeData["projects"]) || [],
    education: (activeResume.education as unknown as ResumeData["education"]) || [],
    certifications: (activeResume.certifications as unknown as ResumeData["certifications"]) || [],
    achievements: (activeResume.achievements as unknown as string[]) || [],
  };

  const res = await tailorResumeWithAI({ masterResume, job, focusAreas });

  if (!res.success || !res.tailoredResume) {
    return { success: false, error: res.error || "Failed to tailor resume" };
  }

  return {
    success: true,
    tailoredResume: res.tailoredResume,
  };
}

export async function saveTailoredResumeAction(
  jobId: string,
  tailoredData: ResumeData,
  resumeName?: string
): Promise<ActionResult & { resumeId?: string; applicationId?: string }> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  const name = resumeName || `Tailored: ${job.title} at ${job.companyName}`;

  // 1. Create Tailored Resume in DB
  const savedResume = await prisma.resume.create({
    data: {
      userId,
      name,
      resumeType: "TAILORED",
      targetRole: job.title,
      summary: tailoredData.summary ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills: (tailoredData.skills ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experience: (tailoredData.experience ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projects: (tailoredData.projects ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      education: (tailoredData.education ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      certifications: (tailoredData.certifications ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      achievements: (tailoredData.achievements ?? undefined) as any,
      isActive: true,
    },
  });

  // 2. Link or Create Application
  let application = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (application) {
    application = await prisma.application.update({
      where: { id: application.id },
      data: {
        resumeId: savedResume.id,
        tailoredResumeId: savedResume.id,
        tailoredSummary: tailoredData.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredSkills: tailoredData.skills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredExp: tailoredData.experience as any,
        appStatus: application.appStatus === "NEW" ? "READY" : application.appStatus,
      },
    });
  } else {
    application = await prisma.application.create({
      data: {
        userId,
        jobId,
        resumeId: savedResume.id,
        tailoredResumeId: savedResume.id,
        tailoredSummary: tailoredData.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredSkills: tailoredData.skills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredExp: tailoredData.experience as any,
        appStatus: "READY",
      },
    });
  }

  revalidatePath("/resumes");
  revalidatePath("/applications");
  revalidatePath("/jobs");

  return {
    success: true,
    resumeId: savedResume.id,
    applicationId: application.id,
  };
}

export interface JdAnalysisSuggestion {
  category: string;
  advice: string;
  suggestedSkillsToAdd?: string[];
  sampleBullet?: string;
}

export interface JdAnalysisData {
  currentAtsScore: number;
  potentialAtsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  criticalKeywords: string[];
  suggestions: JdAnalysisSuggestion[];
  roleSummary: string;
}

export async function analyzeJobForTailoringAction(
  jobId: string
): Promise<ActionResult & { analysis?: JdAnalysisData }> {
  const userId = await getRequiredUserId();

  const [job, user] = await Promise.all([
    prisma.job.findFirst({ where: { id: jobId, userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { skills: true },
        },
        resumes: {
          where: { isActive: true },
          take: 1,
        },
      },
    }),
  ]);

  if (!job) return { success: false, error: "Job not found" };

  const candidateSkills = (user?.profile?.skills || []).map((s) => s.name.toLowerCase());
  const activeResume = user?.resumes[0] || null;
  const resumeSkills = activeResume?.skills
    ? ((activeResume.skills as unknown as ResumeData["skills"])?.technical || []).map((s) => s.toLowerCase())
    : [];

  const combinedCandidateSkills = Array.from(new Set([...candidateSkills, ...resumeSkills]));

  const jdRequired = (job.requiredSkills || []).map((s) => s.trim());
  const jdPreferred = (job.preferredSkills || []).map((s) => s.trim());
  const allJdSkills = Array.from(new Set([...jdRequired, ...jdPreferred]));

  // 1. Keyword Overlap
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  allJdSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (combinedCandidateSkills.some((cs) => cs.includes(sLower) || sLower.includes(cs))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const baseScore = allJdSkills.length > 0
    ? Math.round((matchedSkills.length / allJdSkills.length) * 100)
    : 75;
  const currentScore = Math.max(50, Math.min(95, baseScore));
  const potentialScore = Math.min(98, currentScore + missingSkills.length * 5 + 10);

  // 2. Try AI Deep Analysis
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== "sk-your-openai-api-key") {
    try {
      const { getOpenAIClient, AI_MODELS } = await import("@/lib/ai/client");
      const openai = getOpenAIClient();

      const prompt = `You are a Principal Technical Recruiter and ATS Optimization Expert.
Analyze this job description against the candidate's verified profile to provide strategic tailoring recommendations.

TARGET JOB:
- Title: ${job.title} at ${job.companyName}
- Location: ${job.location || "Remote/India"}
- Required Skills: ${jdRequired.join(", ") || "General Full Stack"}
- Preferred Skills: ${jdPreferred.join(", ") || "None"}
- Responsibilities: ${(job.responsibilities || []).slice(0, 4).join(" | ")}
- Description Snippet: ${(job.description || "").slice(0, 1000)}

CANDIDATE CURRENT SKILLS:
${combinedCandidateSkills.join(", ")}

Analyze in detail and respond ONLY with this JSON structure:
{
  "roleSummary": "1-2 sentence breakdown of what the engineering manager is primarily looking for in this role",
  "criticalKeywords": ["5-7 high-frequency keywords that ATS will score for this specific role"],
  "suggestions": [
    {
      "category": "Skill Optimization / Keyword Gap",
      "advice": "Specific actionable advice on skills to include",
      "suggestedSkillsToAdd": ["Skill1", "Skill2"]
    },
    {
      "category": "High-Impact Project Bullet",
      "advice": "How to frame your existing full-stack experience to match their exact architecture",
      "sampleBullet": "Strong action verb + tech stack + quantified business impact"
    },
    {
      "category": "ATS Alignment Strategy",
      "advice": "Strategic advice for passing this employer's screening filters"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

      return {
        success: true,
        analysis: {
          currentAtsScore: currentScore,
          potentialAtsScore: potentialScore,
          matchedSkills,
          missingSkills,
          criticalKeywords: parsed.criticalKeywords || allJdSkills.slice(0, 7),
          suggestions: parsed.suggestions || [],
          roleSummary: parsed.roleSummary || `${job.title} at ${job.companyName} focusing on scalable software delivery.`,
        },
      };
    } catch (aiErr) {
      console.warn("[JD Analysis Warning]:", aiErr);
    }
  }

  // Deterministic Fallback Strategy
  const suggestions: JdAnalysisSuggestion[] = [
    {
      category: "Critical Skill Gaps",
      advice: missingSkills.length > 0
        ? `The job description emphasizes ${missingSkills.slice(0, 3).join(", ")}. If you have experience with these or related tools, click to add them to your tailored resume.`
        : "Your verified skillset closely matches this role's primary requirements.",
      suggestedSkillsToAdd: missingSkills.slice(0, 4),
    },
    {
      category: "Targeted Project Highlighting",
      advice: `Emphasize hands-on experience developing and deploying scalable full-stack applications with ${matchedSkills.slice(0, 3).join(", ") || "React & Node.js"}.`,
      sampleBullet: `Architected and shipped scalable full-stack features using ${(matchedSkills[0] || "React")} and ${(matchedSkills[1] || "TypeScript")}, reducing API latency and improving responsiveness across high-traffic workflows.`,
    },
    {
      category: "ATS Keyword Density",
      advice: `Ensure that ${allJdSkills.slice(0, 4).join(", ") || job.title} appear in both your professional summary and relevant project bullet points.`,
    },
  ];

  return {
    success: true,
    analysis: {
      currentAtsScore: currentScore,
      potentialAtsScore: potentialScore,
      matchedSkills,
      missingSkills,
      criticalKeywords: allJdSkills.slice(0, 6),
      suggestions,
      roleSummary: `${job.title} at ${job.companyName} looking for strong problem-solving and software engineering capabilities.`,
    },
  };
}