"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateJobPrefsAction, type ActionResult } from "@/actions/profile";
import type { Profile } from "@prisma/client";

const initial: ActionResult = { success: false };

const REMOTE_OPTIONS = [
  { value: "REMOTE_ONLY", label: "Remote Only" },
  { value: "HYBRID_PREFERRED", label: "Hybrid Preferred" },
  { value: "OPEN", label: "Open to Anything" },
  { value: "ONSITE_PREFERRED", label: "Onsite Preferred" },
];

const EMP_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
];

const NOTICE_OPTIONS = ["Immediate","15 days","30 days","45 days","60 days","90 days"];

export function JobPrefsForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, isPending] = useActionState(updateJobPrefsAction, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm">Preferences saved</span>
        </div>
      )}

      {/* Target Roles */}
      <div>
        <label className="label-field">Target Roles <span className="text-slate-600">(comma-separated)</span></label>
        <input name="targetRoles" className="input-field"
          defaultValue={profile?.targetRoles?.join(", ") ?? ""}
          placeholder="Full Stack Developer, Frontend Engineer, React Developer" />
        <p className="text-slate-600 text-xs mt-1">Jobs matching these roles will be prioritized</p>
      </div>

      {/* Employment Types */}
      <div>
        <label className="label-field">Employment Types</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {EMP_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="employmentTypes" value={value}
                defaultChecked={profile?.employmentTypes?.includes(value as never)}
                className="hidden peer" />
              <span className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 peer-checked:bg-blue-600/20 peer-checked:border-blue-500/40 peer-checked:text-blue-300 transition-colors cursor-pointer group-hover:border-white/20">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Remote Preference */}
      <div>
        <label className="label-field">Remote Preference</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {REMOTE_OPTIONS.map(({ value, label }) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="remotePreference" value={value}
                defaultChecked={(profile?.remotePreference ?? "OPEN") === value}
                className="hidden peer" />
              <span className="block text-center px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-400 peer-checked:bg-blue-600/20 peer-checked:border-blue-500/40 peer-checked:text-blue-300 transition-colors hover:border-white/20">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Salary Min */}
        <div>
          <label className="label-field">Min Salary (LPA)</label>
          <input name="salaryMin" type="number" min="0" className="input-field"
            defaultValue={profile?.salaryMin ? profile.salaryMin / 100000 : ""}
            placeholder="e.g. 8" />
        </div>
        {/* Salary Max */}
        <div>
          <label className="label-field">Max Salary (LPA)</label>
          <input name="salaryMax" type="number" min="0" className="input-field"
            defaultValue={profile?.salaryMax ? profile.salaryMax / 100000 : ""}
            placeholder="e.g. 20" />
        </div>
        {/* Notice Period */}
        <div>
          <label className="label-field">Notice Period</label>
          <select name="noticePeriod" className="input-field"
            defaultValue={profile?.noticePeriod ?? "30 days"}>
            {NOTICE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Preferred Locations */}
      <div>
        <label className="label-field">Preferred Locations <span className="text-slate-600">(comma-separated)</span></label>
        <input name="preferredLocations" className="input-field"
          defaultValue={profile?.preferredLocations?.join(", ") ?? ""}
          placeholder="Pune, Bangalore, Mumbai, Remote" />
      </div>

      {/* Priority Keywords */}
      <div>
        <label className="label-field">Priority Keywords <span className="text-slate-600">(boost these)</span></label>
        <input name="priorityKeywords" className="input-field"
          defaultValue={profile?.priorityKeywords?.join(", ") ?? ""}
          placeholder="Next.js, TypeScript, AI, startup" />
      </div>

      {/* Excluded Keywords */}
      <div>
        <label className="label-field">Excluded Keywords <span className="text-slate-600">(skip these)</span></label>
        <input name="excludedKeywords" className="input-field"
          defaultValue={profile?.excludedKeywords?.join(", ") ?? ""}
          placeholder="PHP, WordPress, Magento" />
      </div>

      {/* Min Match Score */}
      <div>
        <label className="label-field">
          Minimum Match Score: <span className="text-blue-400">{profile?.minMatchScore ?? 70}%</span>
        </label>
        <input name="minMatchScore" type="range" min="50" max="95" step="5"
          defaultValue={profile?.minMatchScore ?? 70}
          className="w-full accent-blue-500 mt-2" />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>50% (more results)</span><span>95% (fewer, better)</span>
        </div>
      </div>

      <input type="hidden" name="salaryCurrency" value="INR" />

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
          {isPending ? <><Loader2 size={14} className="animate-spin" />Saving...</> : "Save Preferences"}
        </button>
      </div>
    </form>
  );
}