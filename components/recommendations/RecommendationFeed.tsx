"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowUpRight, Flame, Star, Check } from "lucide-react";
import { RecommendationCard } from "./RecommendationCard";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { batchAnalyzeNewJobsAction } from "@/actions/analysis";
import type { Job, AIAnalysis } from "@prisma/client";

interface Props {
  topMatches: Array<Job & { aiAnalysis?: AIAnalysis | null; applications?: Array<{ id: string; appStatus: string }> }>;
  goodMatches: Array<Job & { aiAnalysis?: AIAnalysis | null; applications?: Array<{ id: string; appStatus: string }> }>;
  considerMatches: Array<Job & { aiAnalysis?: AIAnalysis | null; applications?: Array<{ id: string; appStatus: string }> }>;
  allMatches: Array<Job & { aiAnalysis?: AIAnalysis | null; applications?: Array<{ id: string; appStatus: string }> }>;
  unanalyzedCount: number;
}

export function RecommendationFeed({
  topMatches,
  goodMatches,
  considerMatches,
  allMatches,
  unanalyzedCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"top" | "good" | "all">("top");
  const [selectedJob, setSelectedJob] = useState<(Job & { aiAnalysis?: AIAnalysis | null }) | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const handleBatchAnalyze = async () => {
    setIsBatchAnalyzing(true);
    setBatchMessage(null);
    const res = await batchAnalyzeNewJobsAction();
    setIsBatchAnalyzing(false);

    if (res.success) {
      setBatchMessage(`Analyzed ${res.analyzedCount || 0} jobs successfully!`);
    } else {
      setBatchMessage(res.error || "Batch analysis failed.");
    }
  };

  const displayedJobs =
    activeTab === "top" ? topMatches :
    activeTab === "good" ? goodMatches :
    allMatches;

  return (
    <div className="space-y-6">
      {/* Top Banner with Batch Action */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-blue-500/20">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" />
            AI-Ranked Matches
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Jobs scored against your technical skills, experience level, salary preferences, and location requirements.
          </p>
        </div>

        {unanalyzedCount > 0 && (
          <button
            onClick={handleBatchAnalyze}
            disabled={isBatchAnalyzing}
            className="btn-primary text-xs flex items-center gap-2 shrink-0"
          >
            {isBatchAnalyzing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Analyzing {unanalyzedCount} New Jobs...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Analyze {unanalyzedCount} New Jobs</span>
              </>
            )}
          </button>
        )}
      </div>

      {batchMessage && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{batchMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] gap-6 text-sm">
        <button
          onClick={() => setActiveTab("top")}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "top"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame size={15} className={activeTab === "top" ? "text-amber-400" : ""} />
          <span>Top Matches (80%+)</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
            {topMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("good")}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "good"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Star size={15} className={activeTab === "good" ? "text-blue-400" : ""} />
          <span>Good Fits (70-79%)</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
            {goodMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>All Analyzed Opportunities</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
            {allMatches.length}
          </span>
        </button>
      </div>

      {/* Feed Grid */}
      {displayedJobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Sparkles size={22} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {activeTab === "top"
              ? "No 80%+ top matches yet"
              : activeTab === "good"
              ? "No 70-79% matches yet"
              : "No analyzed matches found"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {unanalyzedCount > 0
              ? `You have ${unanalyzedCount} jobs waiting to be analyzed. Click "Analyze New Jobs" above to calculate match scores.`
              : "Add more jobs or adjust your target skills in your Profile to discover matching opportunities."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedJobs.map((job) => (
            <RecommendationCard
              key={job.id}
              job={job}
              onSelect={(selected) => setSelectedJob(selected)}
            />
          ))}
        </div>
      )}

      {/* Selected Job Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}