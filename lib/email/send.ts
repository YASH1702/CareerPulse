import prisma from "@/lib/db/client";
import { getResendClient } from "./client";
import { DailyDigestEmail, type DailyDigestProps } from "./templates/daily-digest";
import * as React from "react";

export async function sendDailyDigestEmail(params: {
  userId: string;
  userEmail: string;
  digestData: DailyDigestProps;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, userEmail, digestData } = params;

  const resend = getResendClient();

  // 1. Log notification in DB
  await prisma.notification.create({
    data: {
      userId,
      notifType: "NEW_MATCHES",
      title: `Daily Digest: ${digestData.topMatches.length} Top Matches`,
      message: `You have ${digestData.topMatches.length} high-match jobs today.`,
      link: "/recommendations",
      metadata: {
        topMatchesCount: digestData.topMatches.length,
        followUpsCount: digestData.pendingFollowUps.length,
      },
    },
  });

  // 2. If Resend is configured, send actual email
  if (resend) {
    try {
      await resend.emails.send({
        from: "JobPilot AI <updates@resend.dev>",
        to: userEmail,
        subject: `🎯 JobPilot Daily Digest: ${digestData.topMatches.length} Top Matches for You`,
        react: React.createElement(DailyDigestEmail, digestData),
      });
      console.log(`[Email] Sent Daily Digest to ${userEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send via Resend:", err);
      return { success: false, error: err instanceof Error ? err.message : "Failed to send email" };
    }
  } else {
    console.log(`[Email Notice] Resend not configured. Recorded in-app notification for ${userEmail}.`);
  }

  return { success: true };
}