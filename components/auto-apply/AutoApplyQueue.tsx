"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Zap, Play, CheckCircle2, Loader2, ExternalLink, Sparkles, Building2, MapPin, DollarSign, ArrowUpDown } from "lucide-react";
import { executeAutoApplyForJobAction, getAutoApplyQueueAction } from "@/actions/auto-apply";
import { runAutoScrapeAction, SourcingResult } from "@/actions/scraper";
import { RecruiterOutreachModal } from "@/components/jobs/RecruiterOutreachModal";
import { InterviewPrepModal } from "@/components/jobs/InterviewPrepModal";
import { formatRelativeDate } from "@/utils/format";
import type { Job, AIAnalysis, Application } from "@prisma/client";

interface QueuedJob extends Job {
  aiAnalysis?: AIAnalysis | null;
  applications?: Application[];
}

interface Props {
  initialQueue: QueuedJob[];
}

export function AutoApplyQueue({ initialQueue }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueuedJob[]>(initialQueue);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<SourcingResult | null>(null);
  const [selectedState, setSelectedState] = useState("all_india");
  const [sortBy, setSortBy] = useState<"date" | "score" | "company">("date");

  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => {
      if (sortBy === "score") {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
      if (sortBy === "company") {
        return a.companyName.localeCompare(b.companyName);
      }
      return new Date(b.dateDiscovered || b.createdAt).getTime() - new Date(a.dateDiscovered || a.createdAt).getTime();
    });
  }, [queue, sortBy]);

  const handleApplySingle = async (jobId: string) => {
    setProcessingId(jobId);
    const res = await executeAutoApplyForJobAction(jobId);
    setProcessingId(null);

    if (res.success) {
      setQueue((prev) => prev.filter((j) => j.id !== jobId));
      router.refresh();
    } else {
      alert(res.error || "Auto-apply failed.");
    }
  };

  const handleRunScraper = async () => {
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await runAutoScrapeAction({ selectedState });
      setScrapeResult(res);
      const freshQueue = await getAutoApplyQueueAction();
      setQueue(freshQueue as unknown as QueuedJob[]);
      router.refresh();
    } catch (err) {
      setScrapeResult({
        success: false,
        totalFetched: 0,
        newImported: 0,
        existingPreserved: queue.length,
        filteredOut: 0,
        totalActiveQueue: queue.length,
        error: err instanceof Error ? err.message : "Scraping failed.",
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <span>Auto-Apply Live Candidate Queue ({sortedQueue.length} Ready)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Targeting India &amp; top Indian state tech hubs (Bangalore, Hyderabad, Pune, Delhi NCR, Remote).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <ArrowUpDown size={12} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "score" | "company")}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="date" className="bg-slate-900 text-white">⏱️ Newest Discovered</option>
              <option value="score" className="bg-slate-900 text-white">🎯 Highest Match %</option>
              <option value="company" className="bg-slate-900 text-white">🏢 Company Name</option>
            </select>
          </div>

          {/* State / City Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white">
            <MapPin size={13} className="text-blue-400 shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
            >
              <option value="all_india" className="bg-slate-900 text-white">🇮🇳 All India (Default)</option>
              <option value="karnataka" className="bg-slate-900 text-white">Karnataka (Bangalore)</option>
              <option value="telangana" className="bg-slate-900 text-white">Telangana (Hyderabad)</option>
              <option value="maharashtra" className="bg-slate-900 text-white">Maharashtra (Pune &amp; Mumbai)</option>
              <option value="delhi_ncr" className="bg-slate-900 text-white">Delhi NCR (Gurgaon / Noida)</option>
              <option value="tamil_nadu" className="bg-slate-900 text-white">Tamil Nadu (Chennai)</option>
              <option value="kerala" className="bg-slate-900 text-white">Kerala (Kochi / Trivandrum)</option>
              <option value="gujarat" className="bg-slate-900 text-white">Gujarat (Ahmedabad)</option>
              <option value="west_bengal" className="bg-slate-900 text-white">West Bengal (Kolkata)</option>
              <option value="remote_india" className="bg-slate-900 text-white">🌐 Remote (India &amp; Global)</option>
            </select>
          </div>

          <button
            onClick={handleRunScraper}
            disabled={isScraping}
            className="btn-primary text-xs flex items-center gap-2 shrink-0 px-4 py-2"
          >
            {isScraping ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            <span>{isScraping ? "Scraping India Sources..." : "Run Multi-Source Scraper Now"}</span>
          </button>
        </div>
      </div>

      {scrapeResult && (
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Pipeline Synced:</strong> Sourced <strong>{scrapeResult.totalFetched}</strong> roles across India · <strong>{scrapeResult.newImported}</strong> new added · <strong>{scrapeResult.existingPreserved}</strong> existing roles preserved in queue (<strong>{scrapeResult.totalActiveQueue}</strong> total ready to apply).
            </span>
          </div>
          <button onClick={() => setScrapeResult(null)} className="text-slate-400 hover:text-white ml-2 text-xs">✕</button>
        </div>
      )}

      {/* Queue Cards */}
      {sortedQueue.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto text-slate-500">
            <Zap size={24} />
          </div>
          <h4 className="font-semibold text-white text-sm">No Jobs Currently in Auto-Apply Queue</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Run Multi-Source Scraper Now" to automatically search LinkedIn, RemoteOK, Himalayas, and Greenhouse boards for new opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQueue.map((job) => (
            <div
              key={job.id}
              className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-white text-sm">{job.title}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {job.matchScore ?? 80}% Match
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06] capitalize">
                    {job.source.toLowerCase()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {job.freshness === "FRESH" ? "🔥 Fresh (<48h)" : "Active Window"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building2 size={12} className="text-slate-400" />
                    {job.companyName}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location}
                    </span>
                  )}
                  {job.salaryText && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <DollarSign size={12} />
                      {job.salaryText}
                    </span>
                  )}
                </div>

                {job.aiAnalysis?.whyApply && (
                  <p className="text-xs text-slate-300 line-clamp-1 bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                    💡 <strong>Why Apply:</strong> {job.aiAnalysis.whyApply}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end">
                <RecruiterOutreachModal jobId={job.id} jobTitle={job.title} companyName={job.companyName} />
                <InterviewPrepModal jobId={job.id} jobTitle={job.title} companyName={job.companyName} />

                <button
                  onClick={() => handleApplySingle(job.id)}
                  disabled={processingId === job.id}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {processingId === job.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Zap size={13} />
                  )}
                  <span>{processingId === job.id ? "Submitting..." : "Auto-Apply"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}