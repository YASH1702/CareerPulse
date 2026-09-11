"use client";

import React from "react";

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
}

export function ReplicaResumeSheet({
  name = "YASHWANT KARIHA",
  phone = "+91 6375278279",
  email = "yashwantkariha1@gmail.com",
  linkedinUrl = "https://www.linkedin.com/in/yashwant-kariha-740630207/",
  githubUrl = "https://github.com/YASH1702",
  portfolioUrl = "https://vscode-portfolio-main-blush.vercel.app/",
  summary,
  skills,
  experience = [],
  projects = [],
  education = [],
  certifications = [],
  achievements = [],
}: Props) {
  // Default exact summary from yashk.pdf if not overridden
  const displaySummary =
    summary ||
    "Web Developer with 1+ years of experience, skilled in React, Node.js, Express, and MongoDB, with expertise in building responsive, secure, and scalable web applications. Experienced in API integration, modern UI/UX design with Tailwind CSS, and AI-powered solutions.";

  // Format skills by category
  let skillsCategorized: { label: string; text: string }[] = [];

  if (skills && typeof skills === "object") {
    if (skills.frontend || skills.backend) {
      if (skills.frontend) skillsCategorized.push({ label: "Frontend :", text: Array.isArray(skills.frontend) ? skills.frontend.join(", ") : skills.frontend });
      if (skills.backend) skillsCategorized.push({ label: "Backend :", text: Array.isArray(skills.backend) ? skills.backend.join(", ") : skills.backend });
      if (skills.databases) skillsCategorized.push({ label: "Databases :", text: Array.isArray(skills.databases) ? skills.databases.join(", ") : skills.databases });
      if (skills.tools) skillsCategorized.push({ label: "Tools & Platforms :", text: Array.isArray(skills.tools) ? skills.tools.join(", ") : skills.tools });
      if (skills.cloud) skillsCategorized.push({ label: "Cloud & DevOps :", text: Array.isArray(skills.cloud) ? skills.cloud.join(", ") : skills.cloud });
      if (skills.other) skillsCategorized.push({ label: "Other :", text: Array.isArray(skills.other) ? skills.other.join(", ") : skills.other });
    } else {
      // Group standard technical array into exact Canva replica categories
      const tech: string[] = skills.technical || [];
      const frontendSkills = tech.filter((s) => /react|javascript|typescript|tailwind|redux|zustand|material|html|css|cross-platform|frontend/i.test(s));
      const backendSkills = tech.filter((s) => /node|express|api|jwt|auth|socket|websocket|python|django|backend/i.test(s));
      const dbSkills = tech.filter((s) => /mongo|postgres|mysql|prisma|sql|database/i.test(s));
      const toolSkills = tech.filter((s) => /git|github|vite|figma|postman|vscode/i.test(s));
      const cloudSkills = tech.filter((s) => /aws|docker|linux|ci\/cd|devops/i.test(s));
      const otherSkills = tech.filter((s) => /security|openai|ai|machine/i.test(s));

      skillsCategorized = [
        {
          label: "Frontend :",
          text: frontendSkills.length > 0 ? frontendSkills.join(", ") : "JavaScript, React.js, TypeScript, Tailwind CSS, Redux, Zustand, Material UI, Cross-platform, HTML, CSS",
        },
        {
          label: "Backend :",
          text: backendSkills.length > 0 ? backendSkills.join(", ") : "Node.js, Express.js, RESTful APIs, JWT Authentication, Socket.io, WebSocket",
        },
        {
          label: "Databases :",
          text: dbSkills.length > 0 ? dbSkills.join(", ") : "MongoDB, Mongoose, MySQL (basic), PostgreSQL (basic)",
        },
        {
          label: "Tools & Platforms :",
          text: toolSkills.length > 0 ? toolSkills.join(", ") : "Git, GitHub, Vite, Figma",
        },
        {
          label: "Cloud & DevOps :",
          text: cloudSkills.length > 0 ? cloudSkills.join(", ") : "AWS (beginner), Docker, Linux, CI/CD Pipelines (basic), DevOps Fundamentals",
        },
        {
          label: "Other :",
          text: otherSkills.length > 0 ? otherSkills.join(", ") : "Web Security Practices, OpenAI API",
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

  // Exact fallback projects if empty
  const displayProjects = projects.length > 0 ? projects : [
    {
      name: "AI Automation Platform - AI automation platform using Next.js, TypeScript, OpenAI, Prisma, and PostgreSQL",
      bullets: [
        "Built AI-powered workflows to automate repetitive business tasks.",
        "Developed responsive dashboards with authentication and automated workflows.",
      ],
    },
    {
      name: "CipherBox - Password Manager using React, Tailwind CSS, Express.js, MongoDB",
      bullets: [
        "Implemented authentication and CRUD operations for credential management.",
        "Built a responsive UI with secure MongoDB data handling.",
      ],
    },
    {
      name: "FanConnect - Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB",
      bullets: [
        "Built authentication, subscriptions, and payment features.",
        "Developed responsive UI with role-based access control.",
      ],
    },
    {
      name: "Job Tracker - Job Application Platform using TypeScript, React, Express",
      bullets: [
        "Integrated AI to analyze resumes and match job descriptions.",
        "Built responsive UI and scalable APIs for application tracking.",
      ],
    },
  ];

  return (
    <div
      className="bg-white text-black w-full max-w-[850px] mx-auto p-6 sm:p-10 shadow-2xl rounded-sm print:p-0 print:shadow-none print:max-w-none"
      style={{
        fontFamily: "Calibri, 'Carlito', 'Segoe UI', Candara, Arial, sans-serif",
        color: "#000000",
        lineHeight: "1.32",
      }}
    >
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
          <span className="inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z"/>
            </svg>
            <span>{phone}</span>
          </span>

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <svg className="w-3.5 h-3.5 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>{email}</span>
          </a>

          {/* LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <svg className="w-3.5 h-3.5 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/>
            </svg>
            <span>LinkedIn</span>
          </a>

          {/* GitHub */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <svg className="w-3.5 h-3.5 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub</span>
          </a>

          {/* Portfolio */}
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: "#0000ff" }}
          >
            <svg className="w-3.5 h-3.5 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>
            <span>Portfolio</span>
          </a>
        </div>
      </div>

      {/* 2. Professional Summary */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Professional Summary
        </div>
        <p
          className="text-black font-normal"
          style={{ fontSize: "12pt", lineHeight: "1.32", margin: 0 }}
        >
          {displaySummary}
        </p>
      </div>

      {/* 3. Technical Skills */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Technical Skills
        </div>
        <div className="space-y-0.5" style={{ fontSize: "10.7pt" }}>
          {skillsCategorized.map((item, idx) => (
            <div key={idx} className="flex items-start">
              <span className="font-bold text-black shrink-0 mr-1.5" style={{ minWidth: "125px" }}>
                {item.label}
              </span>
              <span className="text-black font-normal flex-1">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Experience */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Experience
        </div>
        <div className="space-y-2.5">
          {displayExperience.map((exp: any, idx: number) => {
            const dateText = exp.dateStr || `${exp.startDate || ""} – ${exp.endDate || (exp.current ? "Present" : "Present")}`;
            const bullets = exp.bullets || [];
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline" style={{ fontSize: "10.7pt" }}>
                  <span>
                    <strong className="font-bold text-black">{exp.company}</strong>
                    <span className="text-black font-normal"> - {exp.role}</span>
                  </span>
                  <span className="font-bold text-black shrink-0">{dateText}</span>
                </div>

                <ul className="list-disc pl-8 space-y-0.5" style={{ fontSize: "10.7pt", margin: 0 }}>
                  {bullets.map((b: string, bIdx: number) => (
                    <li key={bIdx} className="text-black font-normal leading-tight">
                      {b}
                    </li>
                  ))}
                  {exp.techStack && (
                    <li className="text-black font-normal leading-tight">
                      Tech Stack: <strong className="font-bold text-black">{exp.techStack}</strong>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Projects ( Client & Academic ) */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Projects ( Client &amp; Academic )
        </div>
        <div className="space-y-2">
          {displayProjects.map((proj: any, idx: number) => {
            const bullets = proj.bullets || (proj.description ? [proj.description] : []);
            return (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-black" style={{ fontSize: "10.7pt" }}>
                  {proj.name}
                </div>
                <ul className="list-disc pl-8 space-y-0.5" style={{ fontSize: "10.7pt", margin: 0 }}>
                  {bullets.map((b: string, bIdx: number) => (
                    <li key={bIdx} className="text-black font-normal leading-tight">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Education */}
      <div className="mb-3.5">
        <div
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Education
        </div>
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
          className="font-bold uppercase tracking-tight border-b-2 border-black pb-0.5 mb-1.5"
          style={{ fontSize: "12.7pt", color: "#000000" }}
        >
          Additional Information
        </div>
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