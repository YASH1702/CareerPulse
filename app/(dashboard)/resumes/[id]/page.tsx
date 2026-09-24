import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { SaveResumeButton } from "@/components/resumes/PrintResumeButton";
import { ReplicaResumeSheet } from "@/components/resumes/ReplicaResumeSheet";
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
    <div className="space-y-6 max-w-4xl mx-auto print:space-y-0 print:max-w-none print:m-0 print:p-0 print:w-full">
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
          <SaveResumeButton
            resumeId={resume.id}
            filename={`${(user?.name || "Yashwant_Kariha").replace(/\s+/g, "_")}_Resume.pdf`}
          />
        </div>
      </div>

      {/* Exact Visual & Word-for-Word Replica Resume Sheet */}
      <ReplicaResumeSheet
        name={user?.name || "YASHWANT KARIHA"}
        phone={user?.profile?.phone || "+91 6375278279"}
        email={user?.email || "yashwantkariha1@gmail.com"}
        linkedinUrl={user?.profile?.linkedinUrl || "https://www.linkedin.com/in/yashwant-kariha-740630207/"}
        githubUrl={user?.profile?.githubUrl || "https://github.com/YASH1702"}
        portfolioUrl={user?.profile?.portfolioUrl || "https://portfolio3-ial7sxdz4-yashwants-projects-ec1ef74c.vercel.app/"}
        summary={resume.summary}
        skills={skills}
        experience={experience}
        projects={projects}
        education={education}
        certifications={certifications}
      />
    </div>
  );
}