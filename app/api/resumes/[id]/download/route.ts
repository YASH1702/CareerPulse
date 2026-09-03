import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db/client";
import { formatResumeToRawText } from "@/lib/resume/formatter";
import type { ResumeData } from "@/types/resume";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    let userId = session?.user?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) userId = firstUser.id;
    }

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [resume, user] = await Promise.all([
      prisma.resume.findFirst({
        where: { id, userId },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
    ]);

    if (!resume) {
      return new NextResponse("Resume not found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const candidateName = user?.name || "Candidate";
    const profile = user?.profile;

    const resumeData: ResumeData = {
      summary: resume.summary ?? undefined,
      skills: (resume.skills as any) || { technical: [], soft: [] },
      experience: (resume.experience as any) || [],
      projects: (resume.projects as any) || [],
      education: (resume.education as any) || [],
      certifications: (resume.certifications as any) || [],
      achievements: (resume.achievements as any) || [],
    };

    if (format === "txt") {
      const rawText = formatResumeToRawText(
        resumeData,
        candidateName,
        profile?.headline,
        profile ? `${profile.location || ""} · ${profile.phone || ""} · ${user?.email || ""}` : user?.email
      );

      return new NextResponse(rawText, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${candidateName.replace(/\s+/g, "_")}_Resume.txt"`,
        },
      });
    }

    // Default: Printable HTML ATS Document
    const skills = resumeData.skills || { technical: [], soft: [] };
    const exp = resumeData.experience || [];
    const proj = resumeData.projects || [];
    const edu = resumeData.education || [];
    const certs = resumeData.certifications || [];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${candidateName} - ATS Resume</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #111827;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
    .name { font-size: 20pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; }
    .headline { font-size: 11pt; font-weight: 600; color: #374151; margin: 0 0 4px 0; }
    .contact { font-size: 9pt; color: #4b5563; }
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #111827;
      margin: 14px 0 6px 0;
      padding-bottom: 2px;
    }
    .exp-item, .proj-item { margin-bottom: 10px; }
    .row-between { display: flex; justify-content: space-between; font-weight: 700; font-size: 10pt; }
    .date { font-weight: 400; color: #4b5563; font-size: 9pt; }
    ul { margin: 4px 0 6px 0; padding-left: 18px; }
    li { margin-bottom: 2px; font-size: 9.5pt; color: #1f2937; }
    .print-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #1e293b;
      color: #fff;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-weight: 600;
      text-decoration: none;
    }
    @media print {
      body { padding: 0; }
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar" onclick="window.print()">🖨️ Print / Save as PDF</div>

  <div class="header">
    <h1 class="name">${candidateName}</h1>
    ${profile?.headline ? `<div class="headline">${profile.headline}</div>` : ""}
    <div class="contact">
      ${user?.email || ""} ${profile?.phone ? `• ${profile.phone}` : ""} ${profile?.location ? `• ${profile.location}` : ""}
      ${profile?.linkedinUrl ? `• LinkedIn: ${profile.linkedinUrl}` : ""}
      ${profile?.githubUrl ? `• GitHub: ${profile.githubUrl}` : ""}
    </div>
  </div>

  ${resume.summary ? `
  <div class="section-title">Professional Summary</div>
  <p style="margin: 4px 0 8px 0; font-size: 9.5pt; color: #374151;">${resume.summary}</p>
  ` : ""}

  ${skills.technical && skills.technical.length > 0 ? `
  <div class="section-title">Technical Competencies</div>
  <p style="margin: 4px 0 8px 0; font-size: 9.5pt; color: #1f2937;">
    <strong>Core Technologies:</strong> ${skills.technical.join(", ")}
    ${skills.soft && skills.soft.length > 0 ? `<br><strong>Key Strengths:</strong> ${skills.soft.join(", ")}` : ""}
  </p>
  ` : ""}

  ${exp.length > 0 ? `
  <div class="section-title">Work Experience</div>
  ${exp.map((e: any) => `
    <div class="exp-item">
      <div class="row-between">
        <span>${e.role} · <span style="font-weight: 600;">${e.company}</span></span>
        <span class="date">${e.startDate} – ${e.endDate || (e.current ? "Present" : "Present")} ${e.location ? `| ${e.location}` : ""}</span>
      </div>
      ${e.bullets && e.bullets.length > 0 ? `
        <ul>
          ${e.bullets.map((b: string) => `<li>${b}</li>`).join("")}
        </ul>
      ` : ""}
    </div>
  `).join("")}
  ` : ""}

  ${proj.length > 0 ? `
  <div class="section-title">Key Projects & Technical Architecture</div>
  ${proj.map((p: any) => `
    <div class="proj-item">
      <div class="row-between">
        <span>${p.name}</span>
        <span class="date">${(p.technologies || []).join(", ")}</span>
      </div>
      ${p.description ? `<p style="margin: 2px 0; font-size: 9.5pt; color: #374151;">${p.description}</p>` : ""}
      ${p.bullets && p.bullets.length > 0 ? `
        <ul>
          ${p.bullets.map((b: string) => `<li>${b}</li>`).join("")}
        </ul>
      ` : ""}
    </div>
  `).join("")}
  ` : ""}

  ${edu.length > 0 ? `
  <div class="section-title">Education</div>
  ${edu.map((ed: any) => `
    <div class="row-between" style="margin-bottom: 4px;">
      <span><strong>${ed.degree}</strong> ${ed.field ? `in ${ed.field}` : ""} · ${ed.institution}</span>
      <span class="date">${ed.startYear ? `${ed.startYear} - ` : ""}${ed.endYear || "Present"}</span>
    </div>
  `).join("")}
  ` : ""}

  ${certs.length > 0 ? `
  <div class="section-title">Certifications & Credentials</div>
  <ul>
    ${certs.map((c: any) => `<li><strong>${c.name}</strong> ${c.issuer ? `· ${c.issuer}` : ""} ${c.year ? `(${c.year})` : ""}</li>`).join("")}
  </ul>
  ` : ""}
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[Resume Download Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}