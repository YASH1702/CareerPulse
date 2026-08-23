"use client";

import { useState } from "react";
import {
  ExternalLink,
  Sparkles,
  FileText,
  Building2,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import { updateApplicationStatusAction, getApplications } from "@/actions/applications";
import { ResumeTailorModal } from "@/components/resume/ResumeTailorModal";
import { CoverLetterModal } from "@/components/applications/CoverLetterModal";
import { formatRelativeDate } from "@/utils/format";
import type { ApplicationStatus } from "@prisma/client";

type ApplicationWithDetails = Awaited<ReturnType<typeof getApplications>>[number];

interface Props {
  initialApplications: ApplicationWithDetails[];
}

const COLUMNS: Array<{ id: ApplicationStatus; label: string; color: string }> = [
  { id: "READY", label: "Ready to Apply", color: "border-blue-500/40 text-blue-400" },
  { id: "APPLIED", label: "Applied", color: "border-indigo-500/40 text-indigo-400" },
  { id: "INTERVIEW", label: "Interviewing", color: "border-amber-500/40 text-amber-400" },
  { id: "OFFER", label: "Offer Received 🎉", color: "border-emerald-500/40 text-emerald-400" },
  { id: "REJECTED", label: "Archived / Closed", color: "border-slate-500/40 text-slate-400" },
];

export function KanbanBoard({ initialApplications }: Props) {
  const [apps, setApps] = useState<ApplicationWithDetails[]>(initialApplications);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals
  const [tailorJob, setTailorJob] = useState<{ id: string; title: string; companyName: string } | null>(null);
  const [coverJob, setCoverJob] = useState<{ id: string; title: string; companyName: string; text?: string | null } | null>(null);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(appId);
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, appStatus: newStatus } : a))
    );

    await updateApplicationStatusAction(appId, newStatus);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.appStatus === col.id || (col.id === "READY" && a.appStatus === "NEW"));

          return (
            <div
              key={col.id}
              className="glass-card p-4 rounded-xl flex flex-col min-h-[500px] border border-white/[0.06] bg-[#0c1322]"
            >
              {/* Column Header */}
              <div className={`pb-3 mb-3 border-b border-white/[0.06] flex items-center justify-between font-semibold text-xs ${col.color}`}>
                <span>{col.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 text-[11px]">
                  {colApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/20 transition-all space-y-3 relative group"
                  >
                    {/* Top match score & options */}
                    <div className="flex items-center justify-between gap-2">
                      {app.job.matchScore !== null ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {app.job.matchScore}% Match
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Unscored</span>
                      )}

                      <select
                        value={app.appStatus}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        disabled={updatingId === app.id}
                        className="bg-[#131b2e] border border-white/10 text-[10px] rounded px-1.5 py-0.5 text-slate-300 outline-none"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            Move to {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Title & Company */}
                    <div>
                      <h4 className="font-semibold text-white text-xs line-clamp-1">
                        {app.job.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building2 size={11} className="text-blue-400" />
                        <span className="truncate">{app.job.companyName}</span>
                      </p>
                    </div>

                    {/* Quick Package Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <button
                        onClick={() =>
                          setTailorJob({
                            id: app.job.id,
                            title: app.job.title,
                            companyName: app.job.companyName,
                          })
                        }
                        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                          app.resumeId
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white"
                        }`}
                      >
                        <FileText size={10} />
                        <span>{app.resumeId ? "Resume Ready" : "+ Tailor Resume"}</span>
                      </button>

                      <button
                        onClick={() =>
                          setCoverJob({
                            id: app.job.id,
                            title: app.job.title,
                            companyName: app.job.companyName,
                            text: app.coverLetterText,
                          })
                        }
                        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                          app.coverLetterText
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Sparkles size={10} />
                        <span>{app.coverLetterText ? "Letter Ready" : "+ Cover Letter"}</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        {app.appliedAt
                          ? `Applied ${formatRelativeDate(app.appliedAt)}`
                          : `Updated ${formatRelativeDate(app.updatedAt)}`}
                      </span>

                      {app.job.applicationUrl && (
                        <a
                          href={app.job.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                          <span>Apply</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="py-12 text-center text-slate-600 text-xs">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tailor Resume Modal */}
      {tailorJob && (
        <ResumeTailorModal
          jobId={tailorJob.id}
          jobTitle={tailorJob.title}
          companyName={tailorJob.companyName}
          onClose={() => setTailorJob(null)}
        />
      )}

      {/* Cover Letter Modal */}
      {coverJob && (
        <CoverLetterModal
          jobId={coverJob.id}
          jobTitle={coverJob.title}
          companyName={coverJob.companyName}
          initialCoverLetter={coverJob.text}
          onClose={() => setCoverJob(null)}
        />
      )}
    </div>
  );
}