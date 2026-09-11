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
  <title>${candidateName} - Resume</title>
  <style>
    @page { size: letter; margin: 0.4in; }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, 'Carlito', 'Segoe UI', Candara, Arial, sans-serif;
      font-size: 10.7pt;
      line-height: 1.32;
      color: #000000;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 12px; }
    .name { font-size: 22pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; }
    .contact { font-size: 10.7pt; color: #000; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
    .contact a { color: #0000ff; text-decoration: none; }
    .contact a:hover { text-decoration: underline; }
    .section-title {
      font-size: 12.7pt;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 2.5px solid #000;
      margin: 12px 0 6px 0;
      padding-bottom: 2px;
    }
    .row-between { display: flex; justify-content: space-between; align-items: baseline; font-size: 10.7pt; }
    ul { margin: 2px 0 4px 0; padding-left: 28px; }
    li { margin-bottom: 2px; font-size: 10.7pt; color: #000; }
    .skills-row { display: flex; margin-bottom: 2px; font-size: 10.7pt; }
    .skills-label { font-weight: 700; min-width: 130px; }
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
    <div class="contact">
      <span>📞 +91 6375278279</span>
      <a href="mailto:${user?.email || "yashwantkariha1@gmail.com"}">✉️ ${user?.email || "yashwantkariha1@gmail.com"}</a>
      <a href="${profile?.linkedinUrl || "https://www.linkedin.com/in/yashwant-kariha-740630207/"}" target="_blank">LinkedIn</a>
      <a href="${profile?.githubUrl || "https://github.com/YASH1702"}" target="_blank">GitHub</a>
      <a href="${profile?.portfolioUrl || "https://vscode-portfolio-main-blush.vercel.app/"}" target="_blank">Portfolio</a>
    </div>
  </div>

  <div class="section-title">Professional Summary</div>
  <p style="margin: 4px 0 8px 0; font-size: 12pt; line-height: 1.32;">
    ${resume.summary || "Web Developer with 1+ years of experience, skilled in React, Node.js, Express, and MongoDB, with expertise in building responsive, secure, and scalable web applications. Experienced in API integration, modern UI/UX design with Tailwind CSS, and AI-powered solutions."}
  </p>

  <div class="section-title">Technical Skills</div>
  <div>
    <div class="skills-row"><span class="skills-label">Frontend :</span><span>JavaScript, React.js, TypeScript, Tailwind CSS, Redux, Zustand, Material UI, Cross-platform, HTML, CSS</span></div>
    <div class="skills-row"><span class="skills-label">Backend :</span><span>Node.js, Express.js, RESTful APIs, JWT Authentication, Socket.io, WebSocket</span></div>
    <div class="skills-row"><span class="skills-label">Databases :</span><span>MongoDB, Mongoose, MySQL (basic), PostgreSQL (basic)</span></div>
    <div class="skills-row"><span class="skills-label">Tools & Platforms :</span><span>Git, GitHub, Vite, Figma</span></div>
    <div class="skills-row"><span class="skills-label">Cloud & DevOps :</span><span>AWS (beginner), Docker, Linux, CI/CD Pipelines (basic), DevOps Fundamentals</span></div>
    <div class="skills-row"><span class="skills-label">Other :</span><span>Web Security Practices, OpenAI API</span></div>
  </div>

  <div class="section-title">Experience</div>
  <div style="margin-bottom: 8px;">
    <div class="row-between">
      <span><strong>GYMYAK Pvt. Ltd.</strong> - Frontend / Full Stack Developer</span>
      <span style="font-weight: 700;">June 2024 – Aug 25</span>
    </div>
    <ul>
      <li>Delivered and maintained the e-commerce website, improving load speed by ~20%.</li>
      <li>Converted Figma designs into a responsive interface with React + Tailwind CSS.</li>
      <li>Linked backend APIs via Node.js, MongoDB, and Axios to enable core features.</li>
      <li style="list-style: none; margin-left: -16px; margin-top: 2px;">• Tech Stack: <strong>React, Tailwind CSS, Figma, Node.js, MongoDB, Axios, Javascript, HTML, CSS</strong></li>
    </ul>
  </div>
  <div style="margin-bottom: 8px;">
    <div class="row-between">
      <span><strong>Grras Solutions Pvt. Ltd.</strong> - Python Web Developer Intern</span>
      <span style="font-weight: 700;">Jan 2022 – Jun 22</span>
    </div>
    <ul>
      <li>Constructed efficient APIs leveraging Django and PostgreSQL for interactive applications.</li>
      <li>Achieved 30% faster query execution through indexing and caching on high-load database endpoints.</li>
      <li>Delivered interactive CRUD solutions that improved reporting workflows and overall client satisfaction.</li>
      <li style="list-style: none; margin-left: -16px; margin-top: 2px;">• Tech Stack: <strong>Python, Django, PostgreSQL, RESTful APIs</strong></li>
    </ul>
  </div>

  <div class="section-title">Projects ( Client & Academic )</div>
  ${(proj.length > 0 ? proj : [
    {
      name: "AI Automation Platform - AI automation platform using Next.js, TypeScript, OpenAI, Prisma, and PostgreSQL",
      bullets: ["Built AI-powered workflows to automate repetitive business tasks.", "Developed responsive dashboards with authentication and automated workflows."]
    },
    {
      name: "CipherBox - Password Manager using React, Tailwind CSS, Express.js, MongoDB",
      bullets: ["Implemented authentication and CRUD operations for credential management.", "Built a responsive UI with secure MongoDB data handling."]
    },
    {
      name: "FanConnect - Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB",
      bullets: ["Built authentication, subscriptions, and payment features.", "Developed responsive UI with role-based access control."]
    },
    {
      name: "Job Tracker - Job Application Platform using TypeScript, React, Express",
      bullets: ["Integrated AI to analyze resumes and match job descriptions.", "Built responsive UI and scalable APIs for application tracking."]
    }
  ]).map((p: any) => `
    <div style="margin-bottom: 6px;">
      <div style="font-weight: 700; font-size: 10.7pt;">${p.name}</div>
      <ul>
        ${(p.bullets || [p.description]).map((b: string) => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

  <div class="section-title">Education</div>
  <div style="margin-bottom: 6px;">
    <div class="row-between">
      <span style="font-weight: 700;">KSV University</span>
      <span style="font-weight: 700;">Aug 2022 – Jun 2024</span>
    </div>
    <div class="row-between">
      <span>Master of Science in Information Technology - <strong>8.0 CGPA</strong></span>
      <span style="font-style: italic; font-size: 10.1pt;">Gandhinagar, Gujarat</span>
    </div>
  </div>
  <div style="margin-bottom: 6px;">
    <div class="row-between">
      <span style="font-weight: 700;">JECRC University</span>
      <span style="font-style: italic;">Jaipur, Rajasthan</span>
    </div>
    <div class="row-between">
      <span>Bachelor of Computer Applications - <strong>8.20 CGPA</strong></span>
      <span style="font-weight: 700;">Jul 2019 – Jun 2022</span>
    </div>
  </div>
  <div class="row-between" style="margin-bottom: 4px;">
    <span><strong>Senior Secondary RBSE</strong> (12th) – <strong>84.33%</strong></span>
    <span><strong style="font-style: italic; margin-right: 4px;">2018-2019</strong><span style="font-style: italic;">Kekri, Rajasthan</span></span>
  </div>
  <div class="row-between" style="margin-bottom: 6px;">
    <span><strong>Secondary RBSE</strong> (10th) – <strong>85%</strong></span>
    <span><strong style="font-style: italic; margin-right: 4px;">2016-2017</strong><span style="font-style: italic;">Kekri, Rajasthan</span></span>
  </div>

  <div class="section-title">Additional Information</div>
  <div style="font-size: 10.7pt; margin-bottom: 2px;">
    <strong>Achievements :</strong> Secured 3rd place in IDEATHON among 25+ teams by building a full-stack solution in 24 hrs.
  </div>
  <div style="font-size: 10.7pt;">
    <strong>Courses :</strong> Web Development Bootcamp (Udemy), 100x devs Cohort.
  </div>
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