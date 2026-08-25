"use client";

import { useState } from "react";
import { Building2, MapPin, DollarSign, Bookmark, Trash2, Eye, Sparkles, ExternalLink, Calendar, Clock } from "lucide-react";
import { formatRelativeDate } from "@/utils/format";
import { toggleSaveJobAction, deleteJobAction } from "@/actions/jobs";
import type { Job, AIAnalysis } from "@prisma/client";

interface Props {
  job: Job & {
    aiAnalysis?: {
      matchScore: number;
      category?: string;
      recommendation: string;
      strengths: string[];
      missingSkills: string[];
      whyApply?: string | null;
    } | null;
  };
  onSelect: (job: Job & { aiAnalysis?: AIAnalysis | null }) => void;
}

export function JobCard({ job, onSelect }: Props) {
  const [isSaved, setIsSaved] = useState(job.isSaved);
  const [isDeleting, setIsDeleting] = useState(false);

  const remoteLabels: Record<string, string> = {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ONSITE: "On-site",
    UNSPECIFIED: "Unspecified",
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    await toggleSaveJobAction(job.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${job.title}" at ${job.companyName}?`)) {
      setIsDeleting(true);
      await deleteJobAction(job.id);
    }
  };

  const matchScore = job.matchScore ?? job.aiAnalysis?.matchScore ?? null;

  return (
    <div
      onClick={() => onSelect(job as unknown as Job & { aiAnalysis?: AIAnalysis | null })}
      className="glass-card p-5 hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {remoteLabels[job.remoteType] || job.remoteType}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {job.employmentType.replace("_", " ")}
            </span>
            {matchScore !== null && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                matchScore >= 80 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                matchScore >= 65 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}>
                {matchScore}% Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white"
              }`}
              title={isSaved ? "Saved" : "Save Job"}
            >
              <Bookmark size={14} className={isSaved ? "fill-amber-400" : ""} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Title & Company */}
        <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
          {job.title}
        </h3>

        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 text-slate-300 font-medium">
            <Building2 size={13} className="text-blue-400" />
            {job.companyName}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-slate-500" />
              {job.location}
            </span>
          )}
          {job.salaryText && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <DollarSign size={13} />
              {job.salaryText}
            </span>
          )}
        </div>

        {/* Skills Chips */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {job.requiredSkills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 bg-white/[0.03] text-slate-300 rounded border border-white/[0.05]"
              >
                {s}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{job.requiredSkills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-blue-400/90 font-medium">
            <Calendar size={12} className="text-blue-400 shrink-0" />
            Posted {formatRelativeDate(job.datePosted || job.createdAt)}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-slate-500 text-[11px]">
            <Clock size={11} className="text-slate-600 shrink-0" />
            Discovered {formatRelativeDate(job.dateDiscovered || job.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Apply</span>
              <ExternalLink size={12} />
            </a>
          )}
          <span className="text-slate-400 group-hover:text-white flex items-center gap-1 transition-colors">
            <span>Details</span>
            <Eye size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}