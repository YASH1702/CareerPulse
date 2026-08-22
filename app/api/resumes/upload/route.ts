import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db/client";
import { extractTextFromBuffer, estimateWordCount } from "@/lib/resume/parser";
import { extractResumeWithAI } from "@/lib/resume/extractor";
import { uploadResumeFile } from "@/lib/storage/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const resumeName = (formData.get("name") as string) || "My Resume";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5MB" },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    let rawText: string;
    try {
      rawText = await extractTextFromBuffer(buffer, file.type);
    } catch {
      return NextResponse.json(
        { error: "Could not read file. Please ensure it is a valid PDF or DOCX." },
        { status: 422 }
      );
    }

    if (rawText.length < 100) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. Is it a scanned image PDF?" },
        { status: 422 }
      );
    }

    // Upload file to storage (optional — skipped if Supabase not configured)
    const fileUrl = await uploadResumeFile(buffer, file.name, file.type);

    // AI extraction
    let resumeData = null;
    let extractionMeta = null;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey && openaiKey !== "sk-your-openai-api-key") {
      try {
        const result = await extractResumeWithAI(rawText);
        resumeData = result.data;
        extractionMeta = {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          costUsd: result.costUsd,
        };
        console.log(
          `[Resume] AI extraction complete. Cost: $${result.costUsd.toFixed(5)}`
        );
      } catch (err) {
        console.error("[Resume] AI extraction failed:", err);
        // Non-fatal — save without AI data
      }
    } else {
      console.warn("[Resume] OpenAI not configured — skipping AI extraction");
    }

    // Save to DB
    const resume = await prisma.resume.create({
      data: {
        userId,
        name: resumeName,
        resumeType: "MASTER",
        fileUrl,
        fileType: file.type,
        fileName: file.name,
        rawText,
        wordCount: estimateWordCount(rawText),
        summary: resumeData?.summary ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skills: (resumeData?.skills ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experience: (resumeData?.experience ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects: (resumeData?.projects ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        education: (resumeData?.education ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        certifications: (resumeData?.certifications ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        achievements: (resumeData?.achievements ?? undefined) as any,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      extracted: resumeData !== null,
      wordCount: resume.wordCount,
      extractionMeta,
    });
  } catch (err) {
    console.error("[Resume Upload] Error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}