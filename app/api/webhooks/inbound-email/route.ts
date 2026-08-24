import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { classifyInboundEmail } from "@/lib/email/classifier";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, subject, text, companyName } = body;

    if (!subject || (!text && !body.html)) {
      return NextResponse.json({ error: "Missing required email payload fields" }, { status: 400 });
    }

    const emailBody = text || body.html || "";
    const classification = classifyInboundEmail(subject, emailBody);

    // Try finding user by recipient email
    const recipientEmail = typeof to === "string" ? to : Array.isArray(to) ? to[0] : null;
    let user = null;

    if (recipientEmail) {
      user = await prisma.user.findUnique({
        where: { email: recipientEmail },
      });
    }

    // Fallback to first user in dev environment if none specified
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ message: "No matching candidate account found" }, { status: 200 });
    }

    // Try matching application by company name
    const compName = companyName || subject.match(/(?:at|from|with)\s+([A-Za-z0-9\s]+)/i)?.[1]?.trim();
    let app = null;

    if (compName) {
      app = await prisma.application.findFirst({
        where: {
          userId: user.id,
          job: { companyName: { contains: compName, mode: "insensitive" } },
        },
        include: { job: true },
      });
    }

    if (app) {
      if (classification.category === "INTERVIEW_INVITATION") {
        await prisma.application.update({
          where: { id: app.id },
          data: { appStatus: "INTERVIEW" },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "INTERVIEW_REMINDER",
            title: `🎉 Interview Invite: ${app.job.companyName}`,
            message: `You received an interview request for ${app.job.title} from ${from || "Recruiter"}. Check your email!`,
          },
        });
      } else if (classification.category === "APPLICATION_CONFIRMATION") {
        await prisma.application.update({
          where: { id: app.id },
          data: { appStatus: "APPLIED", appliedAt: new Date() },
        });
      } else if (classification.category === "REJECTION") {
        await prisma.application.update({
          where: { id: app.id },
          data: { appStatus: "REJECTED" },
        });
      }

      await prisma.applicationEvent.create({
        data: {
          applicationId: app.id,
          eventType: `INBOUND_EMAIL_${classification.category}`,
          description: `Email received: "${subject}" (${classification.summary})`,
          metadata: { from, subject, category: classification.category },
        },
      });
    }

    return NextResponse.json({
      success: true,
      classification,
      applicationUpdated: app ? app.id : null,
    });
  } catch (err) {
    console.error("[Inbound Email Webhook Error]", err);
    return NextResponse.json({ error: "Failed to process inbound email" }, { status: 500 });
  }
}