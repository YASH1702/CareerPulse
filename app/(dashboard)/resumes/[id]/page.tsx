import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { Printer, ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import type { ResumeData } from "@/types/resume";

export const metadata: Metadata = { title: "ATS Resume Preview | JobPilot AI" };

export default async function ResumeViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getRequiredUserId();
  const { id } = await params;

  const [resume, user] = await Promise.all([
    prisma.resume.findFirst({
      where: { id, userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
  ]);

  if (!resume) notFound();

  const skills = (resume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] };
  const experience = (resume.experience as unknown as ResumeData["experience"]) || [];
  const projects = (resume.projects as unknown as ResumeData["projects"]) || [];
  const education = (resume.education as unknown as ResumeData["education"]) || [];
  const certifications = (resume.certifications as unknown as ResumeData["certifications"]) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Bar (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between p-4 glass-card">
        <Link
          href="/resumes"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Resumes</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Version: <strong className="text-white">{resume.name}</strong> ({resume.resumeType})
          </span>
          <button
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={undefined}
            className="btn-primary text-xs flex items-center gap-1.5"
            id="print-btn"
          >
            <Printer size={14} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ATS-Friendly Document Sheet */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl space-y-6 font-serif text-[13px] leading-relaxed print:p-0 print:shadow-none print:rounded-none">
        {/* Document Header */}
        <div className="text-center border-b border-black/20 pb-4 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-black uppercase">
            {user?.name || "Candidate Name"}
          </h1>
          {user?.profile?.headline && (
            <p className="text-sm font-medium text-slate-800">{user.profile.headline}</p>
          )}
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600 flex-wrap">
            {user?.email && <span>{user.email}</span>}
            {user?.profile?.phone && <span>· {user.profile.phone}</span>}
            {user?.profile?.location && <span>· {user.profile.location}</span>}
            {user?.profile?.linkedinUrl && (
              <span>· <a href={user.profile.linkedinUrl} className="text-blue-700 underline">LinkedIn</a></span>
            )}
            {user?.profile?.githubUrl && (
              <span>· <a href={user.profile.githubUrl} className="text-blue-700 underline">GitHub</a></span>
            )}
          </div>
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Professional Summary
            </h2>
            <p className="text-slate-800 text-xs leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Technical Skills */}
        {skills?.technical && skills.technical.length > 0 && (
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Technical Competencies
            </h2>
            <p className="text-xs text-slate-800">
              <strong>Core Skills:</strong> {skills.technical.join(", ")}
            </p>
            {skills?.soft && skills.soft.length > 0 && (
              <p className="text-xs text-slate-800">
                <strong>Key Strengths:</strong> {skills.soft.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Work Experience
            </h2>
            {experience.map((exp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-xs font-bold text-black">
                  <span>{exp.role} · <span className="font-semibold text-slate-800">{exp.company}</span></span>
                  <span className="text-[11px] font-normal text-slate-600">
                    {exp.startDate} – {exp.endDate || "Present"} {exp.location ? `| ${exp.location}` : ""}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5 pl-1">
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-snug">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Key Projects
            </h2>
            {projects.map((proj, idx) => (
              <div key={idx} className="text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold text-black">{proj.name}</span>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span className="text-[11px] text-slate-600">{proj.technologies.join(", ")}</span>
                  )}
                </div>
                <p className="text-slate-800 text-xs">{proj.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Education
            </h2>
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between text-xs text-slate-800">
                <span><strong>{edu.degree}</strong> {edu.field ? `in ${edu.field}` : ""} · {edu.institution}</span>
                <span className="text-[11px] text-slate-600">{edu.startYear && `${edu.startYear} - `}{edu.endYear || "Present"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
              Certifications &amp; Credentials
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5">
              {certifications.map((cert, idx) => (
                <li key={idx}>
                  <strong>{cert.name}</strong> {cert.issuer ? `· ${cert.issuer}` : ""} {cert.year ? `(${cert.year})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Inline Script for Print Button */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', () => {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}