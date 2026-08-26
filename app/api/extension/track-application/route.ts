import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { recordSuccessfulAutoApply } from "@/lib/auto-apply/safety-limits";

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
    const { jobTitle, companyName, jobUrl, platform, location, salaryText } = body;

    if (!jobTitle || !companyName) {
      const res = NextResponse.json(
        { error: "jobTitle and companyName are required" },
        { status: 400 }
      );
      return setCorsHeaders(res);
    }

    const user = await prisma.user.findFirst({
      include: {
        resumes: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user) {
      const res = NextResponse.json({ error: "User not found" }, { status: 404 });
      return setCorsHeaders(res);
    }

    const activeResume = user.resumes[0] || null;

    // 1. Find or Create Job in Database
    let job = await prisma.job.findFirst({
      where: {
        userId: user.id,
        companyName: { equals: companyName, mode: "insensitive" },
        title: { equals: jobTitle, mode: "insensitive" },
      },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          userId: user.id,
          title: jobTitle,
          companyName,
          location: location || "India",
          source: platform ? platform.toUpperCase() : "LINKEDIN",
          sourceUrl: jobUrl || null,
          applicationUrl: jobUrl || null,
          salaryText: salaryText || null,
          jobStatus: "APPLIED",
          datePosted: new Date(),
          dateDiscovered: new Date(),
          matchScore: 85,
        },
      });
    } else {
      await prisma.job.update({
        where: { id: job.id },
        data: { jobStatus: "APPLIED" },
      });
    }

    // 2. Upsert Application Record
    const application = await prisma.application.upsert({
      where: {
        userId_jobId: { userId: user.id, jobId: job.id },
      },
      create: {
        userId: user.id,
        jobId: job.id,
        resumeId: activeResume?.id || null,
        appStatus: "APPLIED",
        appliedAt: new Date(),
        submissionProof: `Applied via JobPilot Chrome Extension on ${platform || "Web Portal"}`,
      },
      update: {
        appStatus: "APPLIED",
        appliedAt: new Date(),
        submissionProof: `Applied via JobPilot Chrome Extension on ${platform || "Web Portal"}`,
      },
    });

    // 3. Create Audit Event
    await prisma.applicationEvent.create({
      data: {
        applicationId: application.id,
        eventType: "AUTO_APPLY_SUBMITTED",
        description: `Application submitted via JobPilot Chrome Extension for ${jobTitle} at ${companyName} (${platform || "Web"})`,
        metadata: {
          source: platform || "ChromeExtension",
          jobUrl,
          resumeUsed: activeResume?.name || "Master Resume",
        },
      },
    });

    // 4. Update Daily Count
    await recordSuccessfulAutoApply(user.id);

    const res = NextResponse.json({
      success: true,
      message: `Tracked application for ${jobTitle} at ${companyName}`,
      applicationId: application.id,
    });
    return setCorsHeaders(res);
  } catch (err) {
    console.error("[Extension Track Application Error]:", err);
    const res = NextResponse.json(
      { error: "Failed to track application" },
      { status: 500 }
    );
    return setCorsHeaders(res);
  }
}