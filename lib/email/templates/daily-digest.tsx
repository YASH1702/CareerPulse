import * as React from "react";

export interface JobDigestItem {
  id: string;
  title: string;
  companyName: string;
  location?: string | null;
  remoteType?: string | null;
  matchScore: number;
  salaryText?: string | null;
  whyApply?: string | null;
}

export interface FollowUpItem {
  id: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
}

export interface DailyDigestProps {
  userName: string;
  dateStr: string;
  topMatches: JobDigestItem[];
  pendingFollowUps: FollowUpItem[];
  appUrl: string;
}

export function DailyDigestEmail({
  userName,
  dateStr,
  topMatches,
  pendingFollowUps,
  appUrl,
}: DailyDigestProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#0a0f1e", color: "#f8fafc", padding: "24px", maxWidth: "600px", margin: "0 auto", borderRadius: "12px" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px", marginBottom: "20px" }}>
        <h1 style={{ color: "#3b82f6", fontSize: "20px", margin: "0 0 4px 0" }}>CareerPulse</h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>Daily Match &amp; Application Digest · {dateStr}</p>
      </div>

      <p style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: "1.5" }}>
        Good morning, <strong>{userName}</strong>! Here is your curated job search briefing for today.
      </p>

      {/* Top Matches Section */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "16px", color: "#60a5fa", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          🎯 Top Matches Today ({topMatches.length})
        </h2>

        {topMatches.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#64748b" }}>No new 75%+ matches found today. New opportunities will be analyzed as they are discovered.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topMatches.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", margin: "0 0 4px 0" }}>{job.title}</h3>
                  <span style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                    {job.matchScore}% Match
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 8px 0" }}>
                  <strong>{job.companyName}</strong> {job.location ? `· ${job.location}` : ""} ({job.remoteType || "Remote"})
                  {job.salaryText ? ` · ${job.salaryText}` : ""}
                </p>
                {job.whyApply && (
                  <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "0 0 10px 0", backgroundColor: "rgba(59, 130, 246, 0.05)", padding: "6px 8px", borderRadius: "4px" }}>
                    {job.whyApply}
                  </p>
                )}
                <a
                  href={`${appUrl}/jobs`}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Review &amp; Apply →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up Reminders */}
      {pendingFollowUps.length > 0 && (
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ fontSize: "15px", color: "#f59e0b", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ⏰ Follow-Up Due ({pendingFollowUps.length})
          </h2>
          <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px" }}>
            {pendingFollowUps.map((app) => (
              <p key={app.id} style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0" }}>
                • <strong>{app.jobTitle}</strong> at {app.companyName} (Applied on {app.appliedDate})
              </p>
            ))}
            <a
              href={`${appUrl}/applications`}
              style={{ display: "inline-block", marginTop: "8px", color: "#60a5fa", fontSize: "12px", textDecoration: "none" }}
            >
              Open Application Tracker →
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "30px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
        <p style={{ margin: "0" }}>CareerPulse · Smart Job Application Automation</p>
      </div>
    </div>
  );
}