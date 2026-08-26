import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";

function setCorsHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, jobTitle, companyName } = body;

    if (!question || typeof question !== "string") {
      const res = NextResponse.json({ error: "Question is required" }, { status: 400 });
      return setCorsHeaders(res);
    }

    // Fetch primary user profile
    const user = await prisma.user.findFirst({
      include: {
        profile: {
          include: {
            skills: true,
            education: true,
          },
        },
        resumes: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || !user.profile) {
      const res = NextResponse.json({ error: "Profile not found" }, { status: 404 });
      return setCorsHeaders(res);
    }

    const p = user.profile;
    const skillsList = p.skills.map((s) => s.name).join(", ");
    const apiKey = process.env.OPENAI_API_KEY;

    let answer = "";

    if (apiKey && apiKey !== "sk-your-openai-api-key") {
      try {
        const openai = getOpenAIClient();
        const prompt = `You are helping candidate ${user.name || "Yashwant Kariha"} answer a job application screening question.
Candidate Background:
- Title: ${p.headline || "Full Stack Web Developer"}
- Bio: ${p.bio || ""}
- Verified Technical Skills: ${skillsList}
- Total Years Experience: ${p.yearsExperience || 2} years
- Education: M.Sc IT & BCA
- Target Company / Role: ${jobTitle || "Software Engineer"} at ${companyName || "the company"}

Recruiter Question: "${question}"

Instructions:
1. Provide a concise, professional 1-3 sentence response.
2. Highlight relevant technical skills (${skillsList}) and full-stack development experience.
3. NEVER fabricate companies, fake degrees, or false information.
4. Keep the tone confident, articulate, and direct.`;

        const completion = await openai.chat.completions.create({
          model: AI_MODELS.INSIGHTS,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 250,
        });

        answer = completion.choices[0]?.message?.content?.trim() || "";
      } catch (aiErr) {
        console.warn("[Extension AI Answer Warning]:", aiErr);
      }
    }

    // Fallback if AI not available or failed
    if (!answer) {
      const qLower = question.toLowerCase();
      if (qLower.includes("notice period") || qLower.includes("when can you start")) {
        answer = `I am available to join within ${p.noticePeriod || "30 days"} (open to immediate transition).`;
      } else if (qLower.includes("salary") || qLower.includes("compensation") || qLower.includes("ctc")) {
        const sal = p.salaryMin ? `${(p.salaryMin / 100000).toFixed(1)} LPA` : "12-15 LPA";
        answer = `My expected compensation is around ${sal}, negotiable based on the overall role and scope.`;
      } else if (qLower.includes("relocate") || qLower.includes("location") || qLower.includes("onsite") || qLower.includes("hybrid")) {
        answer = "Yes, I am comfortable with both remote and hybrid/on-site arrangements in major tech hubs.";
      } else if (qLower.includes("experience") && (qLower.includes("react") || qLower.includes("node") || qLower.includes("stack") || qLower.includes("years"))) {
        answer = `I have ${p.yearsExperience || 2}+ years of hands-on experience developing and deploying responsive, scalable web applications with React, Next.js, TypeScript, and Node.js.`;
      } else {
        answer = `As a Full Stack Developer with expertise in ${skillsList.split(",").slice(0, 5).join(",")}, I bring hands-on experience building scalable applications, clean APIs, and modern user interfaces.`;
      }
    }

    const res = NextResponse.json({
      success: true,
      question,
      answer,
    });
    return setCorsHeaders(res);
  } catch (err) {
    console.error("[Extension Generate Answer Error]:", err);
    const res = NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
    return setCorsHeaders(res);
  }
}