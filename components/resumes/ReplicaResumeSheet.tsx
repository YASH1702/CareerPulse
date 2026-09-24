"use client";

import React from "react";
import { Phone, Mail, Globe } from "lucide-react";

function LinkedinIcon({ size = 13, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ size = 13, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

interface Props {
  name?: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  summary?: string | null;
  skills?: any;
  experience?: any[];
  projects?: any[];
  education?: any[];
  certifications?: any[];
  achievements?: any[];
  highlightSkills?: string[];
  addedBullets?: string[];
  isSummaryTailored?: boolean;
  badgeLabel?: string;
  badgeVariant?: "default" | "emerald" | "blue";
  scale?: "normal" | "compact";
  id?: string;
}

export function ReplicaResumeSheet({
  id = "replica-resume-sheet",
  name = "YASHWANT KARIHA",
  phone = "+91 6375278279",
  email = "yashwantkariha1@gmail.com",
  linkedinUrl = "https://www.linkedin.com/in/yashwant-kariha-740630207/",
  githubUrl = "https://github.com/YASH1702",
  portfolioUrl = "https://portfolio3-ial7sxdz4-yashwants-projects-ec1ef74c.vercel.app/",
  summary,
  skills,
  experience = [],
  projects = [],
  education = [],
  certifications = [],
  achievements = [],
  highlightSkills = [],
  addedBullets = [],
  isSummaryTailored = false,
  badgeLabel,
  badgeVariant = "default",
  scale = "normal",
}: Props) {
  // Default exact summary from yashk.pdf if not overridden
  const displaySummary =
    summary ||
    "Full-Stack Developer with 1+ years of professional experience building responsive, secure, and scalable web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL/MongoDB. Experienced in RESTful API architecture, Tailwind CSS, Stripe payment workflows, and production AI-powered tools.";

  const lowerAddedBullets = new Set(addedBullets.map((b) => b.trim().toLowerCase()));

  // Format skills by category
  let skillsCategorized: { label: string; text: string }[] = [];

  if (skills && typeof skills === "object") {
    if (skills.frontend || skills.backend) {
      if (skills.frontend) skillsCategorized.push({ label: "Frontend :", text: Array.isArray(skills.frontend) ? skills.frontend.join(", ") : skills.frontend });
      if (skills.backend) skillsCategorized.push({ label: "Backend :", text: Array.isArray(skills.backend) ? skills.backend.join(", ") : skills.backend });
      if (skills.databases || (skills as any)["databases & orm"]) skillsCategorized.push({ label: "Databases & ORM :", text: Array.isArray(skills.databases || (skills as any)["databases & orm"]) ? (skills.databases || (skills as any)["databases & orm"]).join(", ") : (skills.databases || (skills as any)["databases & orm"]) });
      if (skills.tools) skillsCategorized.push({ label: "Tools & Platforms :", text: Array.isArray(skills.tools) ? skills.tools.join(", ") : skills.tools });
      if (skills.cloud) skillsCategorized.push({ label: "Cloud & DevOps :", text: Array.isArray(skills.cloud) ? skills.cloud.join(", ") : skills.cloud });
      if (skills.other || (skills as any).specialized) skillsCategorized.push({ label: "Specialized :", text: Array.isArray(skills.other || (skills as any).specialized) ? (skills.other || (skills as any).specialized).join(", ") : (skills.other || (skills as any).specialized) });
    } else {
      // Group standard technical array into exact Canva replica categories
      const tech: string[] = skills.technical || [];
      const frontendSkills = tech.filter((s) => /react|next|vue|angular|svelte|javascript|typescript|tailwind|redux|zustand|material|html|css|cross-platform|frontend|responsive|ui|web/i.test(s));
      const backendSkills = tech.filter((s) => /node|express|api|rest|jwt|auth|socket|websocket|python|django|fastapi|flask|backend|graphql|nest|microservices|stripe/i.test(s));
      const dbSkills = tech.filter((s) => /mongo|postgres|mysql|prisma|sql|database|redis|nosql|orm|dynamo|sqlite/i.test(s));
      const toolSkills = tech.filter((s) => /git|github|vite|figma|postman|vscode|jira|webpack|npm|yarn/i.test(s));
      const cloudSkills = tech.filter((s) => /aws|docker|linux|ci\/cd|devops|kubernetes|k8s|gcp|azure|cloud|terraform|jenkins|nginx/i.test(s));

      const categorizedSet = new Set([...frontendSkills, ...backendSkills, ...dbSkills, ...toolSkills, ...cloudSkills]);
      const otherSkills = tech.filter((s) => !categorizedSet.has(s));
      if (!otherSkills.some((s) => /security/i.test(s))) otherSkills.push("Web Security (PBKDF2/CORS)");
      if (!otherSkills.some((s) => /openai|ai/i.test(s))) otherSkills.push("OpenAI API / AI Integration");
      if (!otherSkills.some((s) => /performance/i.test(s))) otherSkills.push("Performance Optimization");

      skillsCategorized = [
        {
          label: "Frontend :",
          text: frontendSkills.length > 0 ? frontendSkills.join(", ") : "React.js, Next.js, TypeScript, JavaScript, Tailwind CSS, Redux Toolkit, Zustand, Material UI, HTML5, CSS3",
        },
        {
          label: "Backend :",
          text: backendSkills.length > 0 ? backendSkills.join(", ") : "Node.js, Express.js, RESTful APIs, JWT Authentication, WebSockets (Socket.io), Stripe API",
        },
        {
          label: "Databases & ORM :",
          text: dbSkills.length > 0 ? dbSkills.join(", ") : "PostgreSQL, MongoDB, Prisma ORM, Mongoose, MySQL",
        },
        {
          label: "Tools & Platforms :",
          text: toolSkills.length > 0 ? toolSkills.join(", ") : "Git, GitHub, Postman, Vite, Figma",
        },
        {
          label: "Cloud & DevOps :",
          text: cloudSkills.length > 0 ? cloudSkills.join(", ") : "Docker, AWS, Linux, CI/CD Pipelines, DevOps Fundamentals",
        },
        {
          label: "Specialized :",
          text: otherSkills.length > 0 ? otherSkills.join(", ") : "OpenAI API / AI Integration, Web Security (PBKDF2/CORS), Performance Optimization",
        },
      ];
    }
  }

  // Exact fallback experience if empty
  const displayExperience = experience.length > 0 ? experience : [
    {
      company: "GYMYAK Pvt. Ltd.",
      role: "Frontend / Full Stack Developer",
      dateStr: "June 2024 – Aug 25",
      bullets: [
        "Delivered and maintained the e-commerce website, improving load speed by ~20%.",
        "Converted Figma designs into a responsive interface with React + Tailwind CSS.",
        "Linked backend APIs via Node.js, MongoDB, and Axios to enable core features.",
      ],
      techStack: "React, Tailwind CSS, Figma, Node.js, MongoDB, Axios, Javascript, HTML, CSS",
    },
    {
      company: "Grras Solutions Pvt. Ltd.",
      role: "Python Web Developer Intern",
      dateStr: "Jan 2022 – Jun 22",
      bullets: [
        "Constructed efficient APIs leveraging Django and PostgreSQL for interactive applications.",
        "Achieved 30% faster query execution through indexing and caching on high-load database endpoints.",
        "Delivered interactive CRUD solutions that improved reporting workflows and overall client satisfaction.",
      ],
      techStack: "Python, Django, PostgreSQL, RESTful APIs",
    },
  ];

  // Exact fallback projects if empty (3 focused projects: CareerPulse, TaskForge, CoreDesk)
  const displayProjects = projects.length > 0 ? projects : [
    {
      name: "CareerPulse - Career Application Copilot & Extension using Next.js, TypeScript, PostgreSQL, OpenAI",
      bullets: [
        "Engineered an automated application platform with intelligent resume tailoring, ATS scoring, and multi-source job tracking.",
        "Developed a Manifest V3 Chrome extension for 1-click form autofill and real-time application tracking across career portals.",
      ],
    },
    {
      name: "TaskForge - Event-Driven Workflow Automation Engine using Next.js, TypeScript, OpenAI, Prisma, PostgreSQL",
      bullets: [
        "Built AI-powered workflows to automate repetitive business tasks with asynchronous background job processing.",
        "Developed responsive dashboards with authentication and automated workflows.",
      ],
    },
    {
      name: "CoreDesk - Business Operations & Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB, Stripe",
      bullets: [
        "Architected a subscription platform with Stripe integration, recurring billing, webhooks, and role-based access control.",
        "Implemented an encrypted credential and password management vault with PBKDF2 hashing and secure MongoDB CRUD workflows.",
      ],
    },
  ];

  return (
    <div
      id={id}
      className="replica-resume-sheet bg-white text-black w-full max-w-[850px] mx-auto p-6 sm:p-10 shadow-2xl rounded-sm print:p-0 print:m-0 print:shadow-none print:max-w-none print:w-full"
      style={{
        fontFamily: "Calibri, 'Carlito', 'Segoe UI', Candara, Arial, sans-serif",
        color: "#000000",
        lineHeight: "1.32",
      }}
    >
      {badgeLabel && (
        <div className="mb-3.5 print:hidden flex items-center justify-between border-b border-slate-200 pb-2">
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              badgeVariant === "emerald"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "bg-slate-100 text-slate-800 border border-slate-300"
            }`}
          >
            {badgeLabel}
          </span>
          {highlightSkills.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✨ {highlightSkills.length} Tailored Skills Emphasized
            </span>
          )}
        </div>
      )}

      {/* 1. Header */}
      <div className="text-center mb-3">
        <h1
          className="font-bold tracking-normal uppercase"
          style={{
            fontSize: "22pt",
            marginBottom: "3px",
            color: "#000000",
            letterSpacing: "0.5px",
          }}
        >
          {name}
        </h1>

        {/* Contact info bar with icons */}
        <div
          className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-black font-normal"
          style={{ fontSize: "10.7pt" }}
        >
          {/* Phone */}
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "#000000", textDecoration: "none" }}
          >
            <Phone size={13} className="text-black shrink-0" style={{ verticalAlign: "-1.5px" }} />
            <span>{phone}</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <Mail size={13} className="text-black shrink-0" style={{ verticalAlign: "-1.5px" }} />
            <span>{email}</span>
          </a>

          {/* LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <LinkedinIcon size={13} className="text-blue-600 shrink-0" style={{ verticalAlign: "-1.5px" }} />
            <span>LinkedIn</span>
          </a>

          {/* GitHub */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <GithubIcon size={13} className="text-black shrink-0" style={{ verticalAlign: "-1.5px" }} />
            <span>GitHub</span>
          </a>

          {/* Portfolio */}
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <Globe size={13} className="text-blue-600 shrink-0" style={{ verticalAlign: "-1.5px" }} />
            <span>Portfolio</span>
          </a>
        </div>
      </div>

      {/* 2. Professional Summary */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight flex items-center justify-between"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          <span>Professional Summary</span>
          {isSummaryTailored && (
            <span className="text-[9pt] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider print:hidden">
              ✨ Role-Tailored
            </span>
          )}
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <p
          className={`text-black font-normal transition-all ${
            isSummaryTailored ? "bg-emerald-50/70 p-2 rounded border border-emerald-200 print:bg-transparent print:p-0 print:border-none" : ""
          }`}
          style={{ fontSize: "12pt", lineHeight: "1.32", margin: 0 }}
        >
          {displaySummary}
        </p>
      </div>

      {/* 3. Technical Skills */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          Technical Skills
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <div className="space-y-0.5" style={{ fontSize: "10.7pt" }}>
          {skillsCategorized.map((item, idx) => {
            const lowerHighlights = new Set(highlightSkills.map((h) => h.toLowerCase().trim()));
            const parts = item.text.split(/,\s*/);
            return (
              <div key={idx} className="flex items-start">
                <span className="font-bold text-black shrink-0 mr-1.5" style={{ minWidth: "125px" }}>
                  {item.label}
                </span>
                <span className="text-black font-normal flex-1">
                  {parts.map((p, pIdx) => {
                    const isHigh = lowerHighlights.has(p.toLowerCase().trim());
                    return (
                      <React.Fragment key={pIdx}>
                        {pIdx > 0 && ", "}
                        {isHigh ? (
                          <span className="bg-emerald-100 text-emerald-950 font-bold px-1.5 py-0.2 rounded border border-emerald-400 inline-block shadow-xs print:bg-transparent print:text-black print:border-none print:shadow-none print:p-0 print:font-normal print:inline">
                            {p}<span className="print:hidden"> ✨</span>
                          </span>
                        ) : (
                          p
                        )}
                      </React.Fragment>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Experience */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          Experience
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <div className="space-y-2.5">
          {displayExperience.map((exp: any, idx: number) => {
            const dateText = exp.dateStr || `${exp.startDate || ""} – ${exp.endDate || (exp.current ? "Present" : "Present")}`;
            const rawBullets = exp.bullets || [];
            const bullets = rawBullets.filter((b: string) => !b.trim().toLowerCase().startsWith("tech stack:"));
            const lowerHighlights = new Set(highlightSkills.map((h) => h.toLowerCase().trim()));
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline" style={{ fontSize: "10.7pt" }}>
                  <span>
                    <strong className="font-bold text-black">{exp.company}</strong>
                    <span className="text-black font-normal"> - {exp.role}</span>
                  </span>
                  <span className="font-bold text-black shrink-0">{dateText}</span>
                </div>

                <div style={{ paddingLeft: "16px", margin: 0 }}>
                  {bullets.map((b: string, bIdx: number) => {
                    const isAdded = lowerAddedBullets.has(b.trim().toLowerCase());
                    return (
                      <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "2px", fontSize: "10.7pt", lineHeight: "1.32" }}>
                        <span style={{ display: "inline-block", minWidth: "12px", fontWeight: "bold", fontSize: "11pt", lineHeight: "1.1", color: "#000000" }}>•</span>
                        <div style={{ flex: 1 }}>
                          {isAdded ? (
                            <span className="inline-flex items-start gap-1.5 flex-wrap my-0.5 print:inline print:m-0">
                              <span className="bg-emerald-100 text-emerald-950 border border-emerald-400 text-[9pt] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider inline-block shrink-0 print:hidden">
                                + Added Point ✨
                              </span>
                              <span className="font-semibold text-emerald-950 bg-emerald-50/90 px-1 py-0.5 rounded border border-emerald-200/60 leading-tight print:bg-transparent print:border-none print:p-0 print:font-normal print:text-black print:inline">
                                {b}
                              </span>
                            </span>
                          ) : (
                            b
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {exp.techStack && (
                    <div style={{ display: "flex", alignItems: "flex-start", marginTop: "2px", fontSize: "10.7pt", lineHeight: "1.32" }}>
                      <span style={{ display: "inline-block", minWidth: "12px", fontWeight: "bold", fontSize: "11pt", lineHeight: "1.1", color: "#000000" }}>•</span>
                      <div style={{ flex: 1 }}>
                        Tech Stack:{" "}
                        <strong className="font-bold text-black">
                          {exp.techStack.split(/,\s*/).map((t: string, tIdx: number) => {
                            const isHigh = lowerHighlights.has(t.toLowerCase().trim());
                            return (
                              <React.Fragment key={tIdx}>
                                {tIdx > 0 && ", "}
                                {isHigh ? (
                                  <span className="bg-emerald-100 text-emerald-950 font-bold px-1 py-0.2 rounded border border-emerald-400 inline-block print:bg-transparent print:text-black print:border-none print:shadow-none print:p-0 print:font-bold print:inline">
                                    {t}<span className="print:hidden"> ✨</span>
                                  </span>
                                ) : (
                                  t
                                )}
                              </React.Fragment>
                            );
                          })}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Projects ( Client & Academic ) */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          Projects ( Client &amp; Academic )
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <div className="space-y-2">
          {displayProjects.map((proj: any, idx: number) => {
            const bullets = proj.bullets || (proj.description ? [proj.description] : []);
            return (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-black" style={{ fontSize: "10.7pt" }}>
                  {proj.name}
                </div>
                <div style={{ marginTop: "1px", paddingLeft: "16px" }}>
                  {bullets.map((b: string, bIdx: number) => {
                    const isAdded = lowerAddedBullets.has(b.trim().toLowerCase());
                    return (
                      <div
                        key={bIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          marginBottom: "2px",
                          fontSize: "10.7pt",
                          lineHeight: "1.32",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            minWidth: "12px",
                            fontWeight: "bold",
                            fontSize: "11pt",
                            lineHeight: "1.1",
                            color: "#000000",
                          }}
                        >
                          •
                        </span>
                        <div style={{ flex: 1 }}>
                          {isAdded ? (
                            <span className="inline-flex items-start gap-1.5 flex-wrap my-0.5 print:inline print:m-0">
                              <span className="bg-emerald-100 text-emerald-950 border border-emerald-400 text-[9pt] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider inline-block shrink-0 print:hidden">
                                + Added Point ✨
                              </span>
                              <span className="font-semibold text-emerald-950 bg-emerald-50/90 px-1 py-0.5 rounded border border-emerald-200/60 leading-tight print:bg-transparent print:border-none print:p-0 print:font-normal print:text-black print:inline">
                                {b}
                              </span>
                            </span>
                          ) : (
                            b
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Education */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          Education
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <div className="space-y-2" style={{ fontSize: "10.7pt" }}>
          {/* Row 1: KSV University */}
          <div>
            <div className="flex justify-between items-baseline font-bold text-black">
              <span>KSV University</span>
              <span>Aug 2022 – Jun 2024</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span>Master of Science in Information Technology - <strong className="font-bold">8.0 CGPA</strong></span>
              <span className="italic" style={{ fontSize: "10.1pt" }}>Gandhinagar, Gujarat</span>
            </div>
          </div>

          {/* Row 2: JECRC University */}
          <div>
            <div className="flex justify-between items-baseline">
              <strong className="font-bold text-black">JECRC University</strong>
              <span className="italic">Jaipur, Rajasthan</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span>Bachelor of Computer Applications - <strong className="font-bold">8.20 CGPA</strong></span>
              <span className="font-bold text-black">Jul 2019 – Jun 2022</span>
            </div>
          </div>

          {/* Row 3: Senior Secondary */}
          <div className="flex justify-between items-baseline">
            <span>
              <strong className="font-bold text-black">Senior Secondary RBSE</strong> (12th) – <strong className="font-bold">84.33%</strong>
            </span>
            <span>
              <strong className="font-bold italic mr-1.5">2018-2019</strong>
              <span className="italic">Kekri, Rajasthan</span>
            </span>
          </div>

          {/* Row 4: Secondary */}
          <div className="flex justify-between items-baseline">
            <span>
              <strong className="font-bold text-black">Secondary RBSE</strong> (10th) – <strong className="font-bold">85%</strong>
            </span>
            <span>
              <strong className="font-bold italic mr-1.5">2016-2017</strong>
              <span className="italic">Kekri, Rajasthan</span>
            </span>
          </div>
        </div>
      </div>

      {/* 7. Additional Information */}
      <div className="mb-2">
        <div
          className="font-bold uppercase tracking-tight"
          style={{ fontSize: "12.7pt", color: "#000000", lineHeight: "1.2" }}
        >
          Additional Information
        </div>
        <div style={{ height: "2px", backgroundColor: "#000000", marginTop: "2px", marginBottom: "5px" }} />
        <div className="space-y-1" style={{ fontSize: "10.7pt" }}>
          <div>
            <strong className="font-bold text-black">Achievements:</strong>{" "}
            <span className="text-black font-normal">
              Secured 3rd place in IDEATHON among 25+ teams by building a full-stack solution in 24 hrs.
            </span>
          </div>
          <div>
            <strong className="font-bold text-black">Courses:</strong>{" "}
            <span className="text-black font-normal">
              Web Development Bootcamp (Udemy), 100x devs Cohort.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}