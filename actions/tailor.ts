"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { tailorResumeWithAI } from "@/lib/ai/tailor-resume";
import { estimateWordCount } from "@/lib/resume/parser";
import { formatResumeToRawText } from "@/lib/resume/formatter";
import type { ResumeData } from "@/types/resume";
import type { ActionResult } from "./auth";

export type { ActionResult };

export async function getActiveResumeDataAction(): Promise<
  ActionResult & { resumeData?: ResumeData; resumeId?: string; resumeName?: string }
> {
  const userId = await getRequiredUserId();

  // Always look for user's master custom uploaded resume first
  let activeResume = await prisma.resume.findFirst({
    where: { userId, resumeType: "MASTER", isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId, resumeType: "MASTER" },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!activeResume) {
    return { success: false, error: "No active resume found" };
  }

  const resumeData: ResumeData = {
    summary: activeResume.summary ?? undefined,
    skills: (activeResume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] },
    experience: (activeResume.experience as unknown as ResumeData["experience"]) || [],
    projects: (activeResume.projects as unknown as ResumeData["projects"]) || [],
    education: (activeResume.education as unknown as ResumeData["education"]) || [],
    certifications: (activeResume.certifications as unknown as ResumeData["certifications"]) || [],
    achievements: (activeResume.achievements as unknown as string[]) || [],
  };

  return {
    success: true,
    resumeData,
    resumeId: activeResume.id,
    resumeName: activeResume.name,
  };
}

export async function updateMasterResumeAndProfileAction(
  data: ResumeData
): Promise<ActionResult & { resumeId?: string }> {
  const userId = await getRequiredUserId();

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  const rawText = formatResumeToRawText(
    data,
    user?.name,
    profile?.headline,
    profile ? `${profile.location || ""} · ${profile.phone || ""}` : null
  );
  const wordCount = estimateWordCount(rawText);

  // Target the custom uploaded master resume
  let activeResume = await prisma.resume.findFirst({
    where: { userId, resumeType: "MASTER" },
    orderBy: { createdAt: "desc" },
  });

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Deactivate any other duplicate entries
  await prisma.resume.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  if (!activeResume) {
    activeResume = await prisma.resume.create({
      data: {
        userId,
        name: "My Custom Resume",
        resumeType: "MASTER",
        rawText,
        wordCount,
        summary: data.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skills: (data.skills ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experience: (data.experience ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects: (data.projects ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        education: (data.education ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        certifications: (data.certifications ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        achievements: (data.achievements ?? undefined) as any,
        isActive: true,
      },
    });
  } else {
    activeResume = await prisma.resume.update({
      where: { id: activeResume.id },
      data: {
        rawText,
        wordCount,
        summary: data.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skills: (data.skills ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experience: (data.experience ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects: (data.projects ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        education: (data.education ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        certifications: (data.certifications ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        achievements: (data.achievements ?? undefined) as any,
        isActive: true,
      },
    });
  }

  // Sync technical skills into Profile and Skill relations
  const techSkills = data.skills?.technical || [];
  if (techSkills.length > 0) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      for (const skill of techSkills) {
        const existing = await prisma.skill.findFirst({
          where: { profileId: profile.id, name: { equals: skill, mode: "insensitive" } },
        });
        if (!existing) {
          await prisma.skill.create({
            data: {
              profileId: profile.id,
              name: skill,
              proficiency: "INTERMEDIATE",
              category: "OTHER",
            },
          });
        }
      }
    }
  }

  revalidatePath("/resumes");
  revalidatePath(`/resumes/${activeResume.id}`);
  revalidatePath("/profile");
  revalidatePath("/auto-apply");
  revalidatePath("/jobs");

  return { success: true, resumeId: activeResume.id };
}

export async function tailorResumeAction(
  jobId: string,
  focusAreas?: string[]
): Promise<ActionResult & { tailoredResume?: ResumeData }> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  // Always look for user's master custom uploaded resume first
  let activeResume = await prisma.resume.findFirst({
    where: { userId, resumeType: "MASTER", isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId, resumeType: "MASTER" },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!activeResume) {
    activeResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

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
): Promise<ActionResult & { resumeId?: string; applicationId?: string; targetResumeName?: string }> {
  const userId = await getRequiredUserId();

  const [job, user, profile] = await Promise.all([
    prisma.job.findFirst({ where: { id: jobId, userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  if (!job) return { success: false, error: "Job not found" };

  const rawText = formatResumeToRawText(
    tailoredData,
    user?.name,
    profile?.headline,
    profile ? `${profile.location || ""} · ${profile.phone || ""}` : null
  );
  const wordCount = estimateWordCount(rawText);

  // 1. Find user's master custom uploaded resume as baseline parent
  const masterResume = await prisma.resume.findFirst({
    where: { userId, resumeType: "MASTER" },
    orderBy: { createdAt: "desc" },
  });

  // 2. Check if a TAILORED custom resume already exists specifically for this job
  const existingApp = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  let targetResume = null;
  if (existingApp?.tailoredResumeId) {
    targetResume = await prisma.resume.findFirst({
      where: { id: existingApp.tailoredResumeId, userId },
    });
  }

  if (!targetResume) {
    targetResume = await prisma.resume.findFirst({
      where: {
        userId,
        resumeType: "TAILORED",
        targetRole: job.title,
        name: { contains: job.companyName },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  const defaultTailoredName = `Tailored: ${job.title} at ${job.companyName}`;

  if (targetResume) {
    // Update existing tailored resume
    targetResume = await prisma.resume.update({
      where: { id: targetResume.id },
      data: {
        name: resumeName || targetResume.name || defaultTailoredName,
        targetRole: job.title,
        rawText,
        wordCount,
        summary: tailoredData.summary ?? targetResume.summary,
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
        resumeType: "TAILORED",
        parentId: masterResume?.id || targetResume.parentId,
      },
    });
  } else {
    // Create new dedicated tailored custom resume specifically for this job
    targetResume = await prisma.resume.create({
      data: {
        userId,
        parentId: masterResume?.id || null,
        name: resumeName || defaultTailoredName,
        resumeType: "TAILORED",
        targetRole: job.title,
        rawText,
        wordCount,
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
        isActive: false, // master stays active baseline
      },
    });
  }

  // Ensure master resume exists and is active
  if (masterResume && !masterResume.isActive) {
    await prisma.resume.update({
      where: { id: masterResume.id },
      data: { isActive: true },
    });
  }

  // 3. Sync newly added technical skills into candidate Profile and Skill table
  const techSkills = tailoredData.skills?.technical || [];
  if (techSkills.length > 0) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      for (const skill of techSkills) {
        const existing = await prisma.skill.findFirst({
          where: { profileId: profile.id, name: { equals: skill, mode: "insensitive" } },
        });
        if (!existing) {
          await prisma.skill.create({
            data: {
              profileId: profile.id,
              name: skill,
              proficiency: "INTERMEDIATE",
              category: "OTHER",
            },
          });
        }
      }
    }
  }

  // 4. Link or Update Application record
  let application = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (application) {
    application = await prisma.application.update({
      where: { id: application.id },
      data: {
        resumeId: targetResume.id,
        tailoredResumeId: targetResume.id,
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
        resumeId: targetResume.id,
        tailoredResumeId: targetResume.id,
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
  revalidatePath(`/resumes/${targetResume.id}`);
  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/auto-apply");
  revalidatePath("/profile");

  return {
    success: true,
    resumeId: targetResume.id,
    applicationId: application.id,
    targetResumeName: targetResume.name,
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