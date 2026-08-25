import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ResumeUploader } from "@/components/resumes/ResumeUploader";
import { ResumeCard } from "@/components/resumes/ResumeCard";
import { getResumes } from "@/actions/resumes";
import { FileText, Upload } from "lucide-react";

export const metadata: Metadata = { title: "Resumes | JobPilot AI" };

export default async function ResumesPage() {
  const resumes = await getResumes();
  const activeResume = resumes.find((r) => r.isActive);

  return (
    <div>
      <DashboardHeader title="Resumes & Application Documents" />

      {activeResume && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-semibold">Active Resume for Auto-Apply & Submissions:</p>
              <p className="text-sm font-medium text-white">{activeResume.name}</p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
            Active Master
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload */}
        <div className="lg:col-span-1">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={15} className="text-blue-400" />
              <h2 className="text-sm font-medium text-white">Upload Resume</h2>
            </div>
            <ResumeUploader />
            <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-1.5">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">What happens</p>
              {[
                "Text is extracted from your PDF/DOCX",
                "AI parses skills, experience, projects",
                "Used for job matching and cover letters",
                "Your file stays private",
              ].map((t) => (
                <p key={t} className="text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">·</span> {t}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Resume list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-slate-400" />
            <h2 className="text-sm font-medium text-white">
              Your Resumes{" "}
              <span className="text-slate-600 font-normal">({resumes.length})</span>
            </h2>
          </div>

          {resumes.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">No resumes yet</p>
              <p className="text-slate-600 text-xs">
                Upload your master resume to get started with AI-powered job matching
              </p>
            </div>
          ) : (
            resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                isOnly={resumes.length === 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}