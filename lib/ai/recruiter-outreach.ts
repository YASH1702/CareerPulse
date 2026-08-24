import { getOpenAIClient } from "./client";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";

export interface RecruiterOutreachPackage {
  linkedInConnectionNote: string; // Under 300 characters
  coldEmailSubject: string;
  coldEmailBody: string; // 3 concise paragraphs
  suggestedFollowUp: string;
}

/**
 * Generates high-conversion, personalized recruiter & hiring manager messages.
 */
export async function generateRecruiterOutreach(
  jobId: string,
  targetRecipientType: "ENGINEERING_MANAGER" | "TECHNICAL_RECRUITER" = "ENGINEERING_MANAGER"
): Promise<RecruiterOutreachPackage> {
  const userId = await getRequiredUserId();

  const [job, profile, user] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!job) throw new Error("Job not found");
  if (!profile) throw new Error("Profile not found");

  const candidateName = user?.name || "Candidate";
  const userSkills = profile.skills.map((s) => s.name).join(", ");
  const recipientTitle = targetRecipientType === "ENGINEERING_MANAGER" ? "Engineering Manager / Tech Lead" : "Technical Recruiter";

  // Deterministic Fallback if OpenAI key is not provided
  const fallbackNote = `Hi! I noticed ${job.companyName} is hiring for ${job.title}. With my background in ${profile.skills.slice(0, 2).map((s) => s.name).join(" & ")}, I'd love to connect and share how I can contribute!`;
  const fallbackEmail = `Hi Team,\n\nI recently came across the ${job.title} role at ${job.companyName} and wanted to reach out directly. With over ${profile.yearsExperience || 3} years building scalable systems using ${profile.skills.slice(0, 3).map((s) => s.name).join(", ")}, my background strongly aligns with what you're looking for.\n\nI've submitted my application through your portal and would welcome the chance to briefly discuss how I can help the team achieve its goals.\n\nBest regards,\n${candidateName}`;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai")) {
    return {
      linkedInConnectionNote: fallbackNote.slice(0, 295),
      coldEmailSubject: `${job.title} Application — ${candidateName} (${profile.currentRole || "Software Engineer"})`,
      coldEmailBody: fallbackEmail,
      suggestedFollowUp: `Hi again! Following up on my note regarding the ${job.title} opening at ${job.companyName}. Happy to share a quick overview of recent relevant projects if helpful!`,
    };
  }

  try {
    const openai = getOpenAIClient();
    const prompt = `You are an executive career strategist writing high-conversion recruiter outreach for a candidate.

CANDIDATE:
- Name: ${candidateName}
- Current Role: ${profile.currentRole || "Software Engineer"}
- Years Experience: ${profile.yearsExperience || 3}
- Verified Skills: ${userSkills}

TARGET OPPORTUNITY:
- Company: ${job.companyName}
- Job Title: ${job.title}
- Required Skills: ${job.requiredSkills.join(", ")}
- Recipient: ${recipientTitle}

TASK:
Write:
1. "linkedInConnectionNote": A natural, warm connection request strictly under 290 characters (LinkedIn hard limit is 300).
2. "coldEmailSubject": High-open rate subject line.
3. "coldEmailBody": 3 short, punchy paragraphs (Max 120 words total). Highlight genuine technical overlap without fluff.
4. "suggestedFollowUp": A courteous 2-sentence follow up message to send 5 days later if no response.

Output pure JSON matching the keys:
{
  "linkedInConnectionNote": "...",
  "coldEmailSubject": "...",
  "coldEmailBody": "...",
  "suggestedFollowUp": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      linkedInConnectionNote: (parsed.linkedInConnectionNote || fallbackNote).slice(0, 295),
      coldEmailSubject: parsed.coldEmailSubject || `${job.title} — ${candidateName}`,
      coldEmailBody: parsed.coldEmailBody || fallbackEmail,
      suggestedFollowUp: parsed.suggestedFollowUp || "Following up on my previous note regarding the open role.",
    };
  } catch (err) {
    console.warn("[Recruiter Outreach AI Error]", err);
    return {
      linkedInConnectionNote: fallbackNote.slice(0, 295),
      coldEmailSubject: `${job.title} — ${candidateName}`,
      coldEmailBody: fallbackEmail,
      suggestedFollowUp: "Following up on my previous note regarding the open role.",
    };
  }
}