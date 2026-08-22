"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Briefcase, Bookmark, Sparkles, CheckCircle2 } from "lucide-react";
import { JobCard } from "./JobCard";
import { JobDetailModal } from "./JobDetailModal";
import { AddJobModal } from "./AddJobModal";
import type { Job, AIAnalysis } from "@prisma/client";

interface Props {
  initialJobs: Array<Job & {
    aiAnalysis?: {
      matchScore: number;
      category: string;
      recommendation: string;
      strengths: string[];
      missingSkills: string[];
      whyApply?: string | null;
    } | null;
  }>;
}

export function JobList({ initialJobs }: Props) {
  const [search, setSearch] = useState("");
  const [remoteFilter, setRemoteFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "score" | "company">("date");
  const [selectedJob, setSelectedJob] = useState<(Job & { aiAnalysis?: AIAnalysis | null }) | null>(null);

  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.companyName.toLowerCase().includes(q);
        const matchesLocation = job.location?.toLowerCase().includes(q);
        const matchesSkill = job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesSkill) return false;
      }

      // Remote
      if (remoteFilter !== "ALL" && job.remoteType !== remoteFilter) return false;

      // Status
      if (statusFilter !== "ALL" && job.jobStatus !== statusFilter) return false;

      // Saved only
      if (savedOnly && !job.isSaved) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "score") {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
      if (sortBy === "company") {
        return a.companyName.localeCompare(b.companyName);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [initialJobs, search, remoteFilter, statusFilter, savedOnly, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, company, skill..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-between md:justify-end">
          <select
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            className="input-field py-2 text-xs w-32"
          >
            <option value="ALL">All Locations</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs w-32"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="SAVED">Saved</option>
            <option value="APPLIED">Applied</option>
          </select>

          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              savedOnly
                ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            <Bookmark size={13} className={savedOnly ? "fill-amber-300" : ""} />
            <span>Saved</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "score" | "company")}
            className="input-field py-2 text-xs w-28"
          >
            <option value="date">Newest</option>
            <option value="score">Match Score</option>
            <option value="company">Company</option>
          </select>

          <AddJobModal />
        </div>
      </div>

      {/* Grid of Job Cards */}
      {filteredJobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={22} className="text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No job opportunities found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-5">
            {initialJobs.length === 0
              ? "Start tracking opportunities by adding jobs manually or pasting job descriptions for instant AI parsing."
              : "No jobs match your current search or filter criteria. Try clearing some filters."}
          </p>
          {initialJobs.length === 0 && <AddJobModal />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={(selected) => setSelectedJob(selected)}
            />
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}