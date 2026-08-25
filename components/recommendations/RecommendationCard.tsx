"use client";

import { useState } from "react";
import { Building2, MapPin, DollarSign, Sparkles, Check, ExternalLink, Bookmark, ArrowRight, Eye, Calendar, Clock } from "lucide-react";
import { formatRelativeDate } from "@/utils/format";
import { toggleSaveJobAction } from "@/actions/jobs";
import type { Job, AIAnalysis } from "@prisma/client";

interface Props {
  job: Job & {
    aiAnalysis?: AIAnalysis | null;
    applications?: Array<{ id: string; appStatus: string }>;
  };
  onSelect: (job: Job & { aiAnalysis?: AIAnalysis | null }) => void;
}

export function RecommendationCard({ job, onSelect }: Props) {
  const [isSaved, setIsSaved] = useState(job.isSaved);
  const score = job.matchScore ?? 70;
  const analysis = job.aiAnalysis;

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    await toggleSaveJobAction(job.id);
  };

  return (
    <div
      onClick={() => onSelect(job)}
      className="glass-card p-5 hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent"
    >
      <div>
        {/* Top bar with Match Score & Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
              score >= 80 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
              score >= 70 ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
              "bg-amber-500/15 text-amber-300 border-amber-500/30"
            }`}>
              <Sparkles size={13} />
              <span>{score}% Match</span>
            </div>

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {job.remoteType.replace("_", " ")}
            </span>
          </div>

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

        {/* Why Apply / Summary */}
        {analysis?.whyApply && (
          <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {analysis.whyApply}
          </p>
        )}

        {/* Verified Strengths highlights */}
        {analysis?.strengths && analysis.strengths.length > 0 && (
          <div className="mt-3 space-y-1">
            {analysis.strengths.slice(0, 2).map((s, idx) => (
              <p key={idx} className="text-[11px] text-emerald-400 flex items-center gap-1.5 truncate">
                <Check size={11} className="shrink-0 font-bold" />
                <span className="truncate">{s}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-blue-400/90 font-medium text-[11px]">
            <Calendar size={11} className="text-blue-400 shrink-0" />
            Posted {formatRelativeDate(job.datePosted || job.createdAt)}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-slate-500 text-[10px]">
            <Clock size={10} className="text-slate-600 shrink-0" />
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
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
            >
              <span>Site</span>
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => onSelect(job)}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Review</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}