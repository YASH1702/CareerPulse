"use client";

import { X, ExternalLink, Building2, MapPin, DollarSign, Calendar, Sparkles, Check, CheckCircle2, Bookmark, Trash2 } from "lucide-react";
import { formatRelativeDate } from "@/utils/format";
import { toggleSaveJobAction, deleteJobAction } from "@/actions/jobs";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import type { Job, AIAnalysis } from "@prisma/client";

interface Props {
  job: (Job & { aiAnalysis?: AIAnalysis | null }) | null;
  onClose: () => void;
}

export function JobDetailModal({ job, onClose }: Props) {
  if (!job) return null;

  const remoteLabels: Record<string, string> = {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ONSITE: "On-site",
    UNSPECIFIED: "Location not specified",
  };

  const handleToggleSave = async () => {
    await toggleSaveJobAction(job.id);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${job.title}" at ${job.companyName}?`)) {
      await deleteJobAction(job.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#0d1527]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                {remoteLabels[job.remoteType] || job.remoteType}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                {job.employmentType.replace("_", " ")}
              </span>
              {job.matchScore !== null && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  job.matchScore >= 80 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                  job.matchScore >= 65 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                  "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}>
                  {job.matchScore}% Match
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{job.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Building2 size={15} className="text-blue-400" />
                {job.companyName}
              </span>
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-500" />
                  {job.location}
                </span>
              )}
              {job.salaryText && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <DollarSign size={14} />
                  {job.salaryText}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Calendar size={13} />
                Added {formatRelativeDate(job.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-lg border transition-colors ${
                job.isSaved
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
              }`}
              title={job.isSaved ? "Saved" : "Save Job"}
            >
              <Bookmark size={16} className={job.isSaved ? "fill-amber-400" : ""} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-red-400 transition-colors"
              title="Delete Job"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* AI Match Overview */}
          <AIAnalysisPanel
            jobId={job.id}
            analysis={job.aiAnalysis || null}
            matchScore={job.matchScore}
          />

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Required Technical Skills ({job.requiredSkills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-md text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Preferred / Nice-to-Have Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded-md text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Key Responsibilities
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Description */}
          {job.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full Description
              </h3>
              <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {job.description}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Source: <span className="text-slate-200 font-medium capitalize">{job.source.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            {job.applicationUrl ? (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <span>Apply on Company Site</span>
                <ExternalLink size={14} />
              </a>
            ) : (
              <p className="text-xs text-slate-500">No external application link provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}