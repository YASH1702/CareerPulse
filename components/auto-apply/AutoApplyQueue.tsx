"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Zap, Play, CheckCircle2, Loader2, ExternalLink, Sparkles, Building2, MapPin, DollarSign, ArrowUpDown, Filter, Calendar, Clock } from "lucide-react";
import { executeAutoApplyForJobAction, getAutoApplyQueueAction } from "@/actions/auto-apply";
import { runAutoScrapeAction, SourcingResult } from "@/actions/scraper";
import { STATE_KEYWORD_MAP } from "@/lib/jobs/locations";
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

const QUICK_FILTER_PILLS = [
  { id: "all_india", label: "🇮🇳 All India (On-site + Remote)" },
  { id: "remote_india", label: "🌐 India Remote Only (WFH)" },
  { id: "karnataka", label: "📍 Bangalore" },
  { id: "telangana", label: "📍 Hyderabad" },
  { id: "maharashtra", label: "📍 Pune & Mumbai" },
  { id: "delhi_ncr", label: "📍 Delhi NCR" },
  { id: "tamil_nadu", label: "📍 Chennai" },
];

export function AutoApplyQueue({ initialQueue }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueuedJob[]>(initialQueue);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<SourcingResult | null>(null);
  const [selectedState, setSelectedState] = useState("all_india");
  const [sortBy, setSortBy] = useState<"date" | "score" | "company">("date");
  const [displayLimit, setDisplayLimit] = useState(60);

  // Dynamic counts per location
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = { all_india: queue.length };
    for (const pill of QUICK_FILTER_PILLS) {
      if (pill.id === "all_india") continue;
      if (pill.id === "remote_india") {
        counts.remote_india = queue.filter(
          (j) => j.remoteType === "REMOTE" || (j.location || "").toLowerCase().includes("remote")
        ).length;
        continue;
      }
      const kws = STATE_KEYWORD_MAP[pill.id] || [];
      counts[pill.id] = queue.filter((j) => {
        const loc = (j.location || "").toLowerCase();
        return kws.some((kw) => loc.includes(kw));
      }).length;
    }
    return counts;
  }, [queue]);

  const filteredAndSortedQueue = useMemo(() => {
    let list = queue;

    if (selectedState === "remote_india") {
      list = list.filter(
        (j) => j.remoteType === "REMOTE" || (j.location || "").toLowerCase().includes("remote")
      );
    } else if (selectedState !== "all_india") {
      const keywords = STATE_KEYWORD_MAP[selectedState] || [];
      list = list.filter((j) => {
        const loc = (j.location || "").toLowerCase();
        return keywords.some((kw) => loc.includes(kw));
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === "score") {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
      if (sortBy === "company") {
        return a.companyName.localeCompare(b.companyName);
      }
      return new Date(b.dateDiscovered || b.createdAt).getTime() - new Date(a.dateDiscovered || a.createdAt).getTime();
    });
  }, [queue, selectedState, sortBy]);

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

  const visibleJobs = filteredAndSortedQueue.slice(0, displayLimit);

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <span>Auto-Apply Live Candidate Queue ({filteredAndSortedQueue.length} Active Positions)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verified engineering roles across India's top tech hubs &amp; remote positions.
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

          {/* Scrape Trigger */}
          <button
            onClick={handleRunScraper}
            disabled={isScraping}
            className="btn-primary text-xs flex items-center gap-2 shrink-0 px-4 py-2"
          >
            {isScraping ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            <span>{isScraping ? "Syncing Live Openings..." : "Run Multi-Source Scraper Now"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Location Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1 shrink-0">
          <Filter size={13} className="text-blue-400" />
          <span>Location Filter:</span>
        </div>
        {QUICK_FILTER_PILLS.map((pill) => {
          const count = locationCounts[pill.id] ?? 0;
          const isActive = selectedState === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => {
                setSelectedState(pill.id);
                setDisplayLimit(60);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5 hover:border-white/10"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
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
      {filteredAndSortedQueue.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto text-slate-500">
            <Zap size={24} />
          </div>
          <h4 className="font-semibold text-white text-sm">
            No Jobs Found for {QUICK_FILTER_PILLS.find((p) => p.id === selectedState)?.label || "Selected Location"}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Run Multi-Source Scraper Now" to fetch live engineering roles for this location, or switch to <strong>All India</strong> to view all available positions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white text-sm">{job.title}</span>
                  {job.matchScore !== null && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        job.matchScore >= 85
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : job.matchScore >= 75
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {job.matchScore}% Match
                    </span>
                  )}
                  <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">
                    {job.source}
                  </span>
                  {job.remoteType === "REMOTE" && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      🌐 Remote
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <Building2 size={13} className="text-slate-500" />
                    {job.companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-500" />
                    {job.location || "India"}
                  </span>
                  {job.salaryText && (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <DollarSign size={13} />
                      {job.salaryText}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-blue-400/90 font-medium">
                    <Calendar size={12} className="text-blue-400 shrink-0" />
                    Posted {formatRelativeDate(job.datePosted || job.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock size={12} className="text-slate-600 shrink-0" />
                    Discovered {formatRelativeDate(job.dateDiscovered || job.createdAt)}
                  </span>
                </div>

                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800/60 text-slate-300 border border-white/5 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <RecruiterOutreachModal
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.companyName}
                />
                <InterviewPrepModal
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.companyName}
                />
                <a
                  href={job.applicationUrl || job.sourceUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs p-2.5 flex items-center justify-center"
                  title="View original posting"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => handleApplySingle(job.id)}
                  disabled={processingId === job.id}
                  className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  {processingId === job.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span>Apply Now</span>
                </button>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {filteredAndSortedQueue.length > displayLimit && (
            <div className="text-center pt-4 pb-6">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                className="btn-secondary px-6 py-2.5 text-xs font-semibold border border-white/10 hover:border-white/20 transition-all shadow-sm"
              >
                Load More Openings (Showing {displayLimit} of {filteredAndSortedQueue.length} Active Positions)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}