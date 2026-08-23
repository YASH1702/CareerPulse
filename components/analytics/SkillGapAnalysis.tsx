"use client";

import { AlertTriangle, Check, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SkillItem {
  skill: string;
  count: number;
  percentage: number;
}

interface Props {
  missingSkills: SkillItem[];
  matchedSkills: SkillItem[];
  totalJobs: number;
}

export function SkillGapAnalysis({ missingSkills, matchedSkills, totalJobs }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Missing Skills (High Demand Gaps) */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>In-Demand Skill Gaps</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Skills frequently required by your targeted jobs that aren&apos;t on your profile.
            </p>
          </div>
          <Link
            href="/profile?tab=skills"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Edit Profile</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {missingSkills.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No missing skill gaps detected! Your profile covers all requirements in your active jobs.
          </p>
        ) : (
          <div className="space-y-3">
            {missingSkills.map((item) => (
              <div key={item.skill} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.skill}</span>
                  <span className="text-amber-400 font-medium">
                    in {item.count} jobs ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500/80 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Matching Strengths */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span>Strongest Market Alignments</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Your verified skills that appear most frequently in job requirements.
          </p>
        </div>

        {matchedSkills.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Add skills to your profile and discover jobs to see market alignment.
          </p>
        ) : (
          <div className="space-y-3">
            {matchedSkills.map((item) => (
              <div key={item.skill} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.skill}</span>
                  <span className="text-emerald-400 font-medium">
                    in {item.count} jobs ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/80 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}