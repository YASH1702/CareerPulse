import { getOpenAIClient } from "./client";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";

export interface InterviewPrepGuide {
  technicalQuestions: Array<{
    question: string;
    topic: string;
    modelAnswerKeyPoints: string[];
  }>;
  behavioralQuestions: Array<{
    prompt: string;
    starFrameworkTip: string;
  }>;
  smartQuestionsToAsk: string[];
  companyCultureBrief: string;
}

/**
 * Generates an interview cheat sheet tailored to the target job description.
 */
export async function generateInterviewPrepGuide(jobId: string): Promise<InterviewPrepGuide> {
  const userId = await getRequiredUserId();

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    }),
  ]);

  if (!job) throw new Error("Job not found");
  if (!profile) throw new Error("Profile not found");

  const skillsList = profile.skills.map((s) => s.name).join(", ");

  // Deterministic Fallback
  const fallbackGuide: InterviewPrepGuide = {
    technicalQuestions: [
      {
        question: `How would you architect a production feature at ${job.companyName} using ${job.requiredSkills.slice(0, 2).join(" & ") || "modern tech stacks"}?`,
        topic: "System Architecture",
        modelAnswerKeyPoints: [
          "Discuss data flow, caching layer (Redis), and database indexing strategy",
          "Highlight error boundaries, observability, and automated regression testing",
          "Emphasize latency, horizontal scaling, and security compliance",
        ],
      },
      {
        question: `What are common failure modes and performance bottlenecks you have solved with ${job.requiredSkills[0] || "web frameworks"}?`,
        topic: "Performance & Debugging",
        modelAnswerKeyPoints: [
          "Explain profiling methods and memory/CPU bottleneck identification",
          "Describe concrete optimizations that reduced load times or database query execution time",
        ],
      },
    ],
    behavioralQuestions: [
      {
        prompt: `Tell me about a time you had a technical disagreement with a teammate at ${job.companyName}’s scale.`,
        starFrameworkTip: "Situation: complex requirement; Task: opposing design choices; Action: built a quick prototype benchmark; Result: data-driven team consensus.",
      },
    ],
    smartQuestionsToAsk: [
      `What are the most critical engineering priorities for the ${job.title} team over the next 6 months?`,
      `How does engineering collaborate with product and design on feature prioritization here?`,
      `What does success look like for someone in this role during their first 90 days?`,
    ],
    companyCultureBrief: `${job.companyName} values proactive ownership, strong technical depth, and clean engineering standards.`,
  };

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai")) {
    return fallbackGuide;
  }

  try {
    const openai = getOpenAIClient();
    const prompt = `You are a Principal Tech Interviewer and Hiring Coach. Prepare an interview cheat-sheet for a candidate.

CANDIDATE:
- Role: ${profile.currentRole || "Software Engineer"} (${profile.yearsExperience || 3} YoE)
- Skills: ${skillsList}

JOB DESCRIPTION:
- Company: ${job.companyName}
- Title: ${job.title}
- Required Skills: ${job.requiredSkills.join(", ")}
- Job Description: ${(job.description || "").slice(0, 2000)}

TASK:
Produce a structured JSON guide:
1. "technicalQuestions": Array of 3 challenging technical questions for this exact role, with "question", "topic", and "modelAnswerKeyPoints" (array of 2-3 bullet items).
2. "behavioralQuestions": Array of 2 company-specific behavioral questions with "prompt" and "starFrameworkTip".
3. "smartQuestionsToAsk": Array of 3 thoughtful questions to ask the interviewer.
4. "companyCultureBrief": 2 sentences summarizing the engineering mindset.

Output pure JSON matching the schema.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      technicalQuestions: parsed.technicalQuestions || fallbackGuide.technicalQuestions,
      behavioralQuestions: parsed.behavioralQuestions || fallbackGuide.behavioralQuestions,
      smartQuestionsToAsk: parsed.smartQuestionsToAsk || fallbackGuide.smartQuestionsToAsk,
      companyCultureBrief: parsed.companyCultureBrief || fallbackGuide.companyCultureBrief,
    };
  } catch (err) {
    console.warn("[Interview Prep AI Error]", err);
    return fallbackGuide;
  }
}