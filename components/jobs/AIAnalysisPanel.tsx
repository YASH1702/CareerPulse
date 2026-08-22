"use client";

import { useState } from "react";
import { Sparkles, Check, AlertCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { runJobAnalysisAction } from "@/actions/analysis";
import type { AIAnalysis } from "@prisma/client";

interface Props {
  jobId: string;
  analysis: AIAnalysis | null;
  matchScore: number | null;
  onAnalysisUpdated?: () => void;
}

export function AIAnalysisPanel({ jobId, analysis, matchScore, onAnalysisUpdated }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    const res = await runJobAnalysisAction(jobId);
    setIsAnalyzing(false);

    if (!res.success) {
      setError(res.error || "Analysis failed.");
    } else {
      if (onAnalysisUpdated) onAnalysisUpdated();
    }
  };

  const score = analysis?.matchScore ?? matchScore ?? null;

  if (!analysis && score === null) {
    return (
      <div className="p-5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 text-center space-y-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto text-blue-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">AI Match Analysis</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Evaluate how well this job matches your profile skills, experience, location, and salary preferences.
          </p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="btn-primary text-xs mx-auto flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Analyzing Match...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Run AI Match Analysis</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base border ${
            (score ?? 0) >= 80 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
            (score ?? 0) >= 65 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
            "bg-amber-500/15 text-amber-400 border-amber-500/30"
          }`}>
            {score}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                {analysis?.category ? `${analysis.category.charAt(0) + analysis.category.slice(1).toLowerCase()} Match` : "Match Rating"}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                analysis?.recommendation === "APPLY" ? "bg-emerald-500/20 text-emerald-300" :
                analysis?.recommendation === "CONSIDER" ? "bg-blue-500/20 text-blue-300" :
                "bg-amber-500/20 text-amber-300"
              }`}>
                {analysis?.recommendation || "APPLY"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on your profile skills, experience, and job requirements
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="btn-ghost text-xs flex items-center gap-1.5"
          title="Re-run Analysis"
        >
          {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          <span className="hidden sm:inline">Re-analyze</span>
        </button>
      </div>

      {/* Why Apply */}
      {analysis?.whyApply && (
        <div className="p-3 bg-blue-500/[0.05] border border-blue-500/15 rounded-lg text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
            <Sparkles size={13} />
            AI Assessment
          </p>
          {analysis.whyApply}
        </div>
      )}

      {/* Breakdown Meters */}
      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <Meter label="Technical Skills" val={analysis.technicalScore ?? score ?? 75} />
          <Meter label="Experience Fit" val={analysis.experienceScore ?? 75} />
          <Meter label="Role Alignment" val={analysis.roleScore ?? 80} />
          <Meter label="Location/Remote" val={analysis.locationScore ?? 85} />
          <Meter label="Salary Alignment" val={analysis.salaryScore ?? 80} />
          <Meter label="Career Growth" val={analysis.growthScore ?? 75} />
        </div>
      )}

      {/* Strengths & Missing Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {analysis?.strengths && analysis.strengths.length > 0 && (
          <div className="p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/15 space-y-1.5">
            <p className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Check size={13} /> Key Strengths
            </p>
            <ul className="space-y-1 text-slate-300">
              {analysis.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis?.missingSkills && analysis.missingSkills.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/[0.03] border border-amber-500/15 space-y-1.5">
            <p className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <AlertTriangle size={13} /> Missing Skills
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.missingSkills.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20 text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Concerns */}
      {analysis?.concerns && analysis.concerns.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/[0.03] border border-red-500/15 space-y-1 text-xs">
          <p className="font-semibold text-red-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <AlertCircle size={13} /> Considerations & Concerns
          </p>
          <ul className="space-y-1 text-slate-400">
            {analysis.concerns.map((c, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Meter({ label, val }: { label: string; val: number }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white">{val}%</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            val >= 80 ? "bg-emerald-500" : val >= 65 ? "bg-blue-500" : "bg-amber-500"
          }`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}