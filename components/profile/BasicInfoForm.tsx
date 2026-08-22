"use client";

import { useActionState } from "react";
import { User, Phone, MapPin, Briefcase, Link2, Loader2, CheckCircle2 } from "lucide-react";
import { updateBasicInfoAction, type ActionResult } from "@/actions/profile";
import type { User as UserType, Profile } from "@prisma/client";

interface Props {
  user: UserType & { profile: Profile | null };
}

const initial: ActionResult = { success: false };

export function BasicInfoForm({ user }: Props) {
  const [state, formAction, isPending] = useActionState(updateBasicInfoAction, initial);
  const p = user.profile;

  return (
    <form action={formAction} className="space-y-5">
      {state.success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm">Saved successfully</span>
        </div>
      )}
      {state.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" icon={<User size={14} />} error={state.fieldErrors?.name?.[0]}>
          <input name="name" defaultValue={user.name ?? ""} required
            className="input-field" placeholder="Your full name" />
        </Field>

        <Field label="Phone" icon={<Phone size={14} />}>
          <input name="phone" defaultValue={p?.phone ?? ""} type="tel"
            className="input-field" placeholder="+91 99999 99999" />
        </Field>

        <Field label="Current Location" icon={<MapPin size={14} />}>
          <input name="location" defaultValue={p?.location ?? ""}
            className="input-field" placeholder="e.g. Pune, Maharashtra" />
        </Field>

        <Field label="Current Role" icon={<Briefcase size={14} />}>
          <input name="currentRole" defaultValue={p?.currentRole ?? ""}
            className="input-field" placeholder="e.g. Frontend Developer" />
        </Field>

        <Field label="Years of Experience">
          <input name="yearsExperience" type="number" min="0" max="50"
            defaultValue={p?.yearsExperience ?? ""}
            className="input-field" placeholder="e.g. 3" />
        </Field>

        <div />
      </div>

      <Field label="Professional Headline">
        <input name="headline" defaultValue={p?.headline ?? ""}
          className="input-field" placeholder="e.g. Full Stack Developer | React · Next.js · Node.js" maxLength={120} />
      </Field>

      <Field label="Bio / Summary">
        <textarea name="bio" defaultValue={p?.bio ?? ""} rows={4}
          className="input-field resize-none" maxLength={1000}
          placeholder="Brief professional summary about yourself..." />
      </Field>

      <div className="border-t border-white/[0.05] pt-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Social Links</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LinkedIn URL" icon={<Link2 size={14} />} error={state.fieldErrors?.linkedinUrl?.[0]}>
            <input name="linkedinUrl" defaultValue={p?.linkedinUrl ?? ""}
              className="input-field" placeholder="https://linkedin.com/in/..." />
          </Field>
          <Field label="GitHub URL" error={state.fieldErrors?.githubUrl?.[0]}>
            <input name="githubUrl" defaultValue={p?.githubUrl ?? ""}
              className="input-field" placeholder="https://github.com/..." />
          </Field>
          <Field label="Portfolio URL" error={state.fieldErrors?.portfolioUrl?.[0]}>
            <input name="portfolioUrl" defaultValue={p?.portfolioUrl ?? ""}
              className="input-field" placeholder="https://yourportfolio.com" />
          </Field>
          <Field label="Website URL" error={state.fieldErrors?.websiteUrl?.[0]}>
            <input name="websiteUrl" defaultValue={p?.websiteUrl ?? ""}
              className="input-field" placeholder="https://..." />
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isPending}
          className="btn-primary flex items-center gap-2">
          {isPending ? <><Loader2 size={14} className="animate-spin" />Saving...</> : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, icon, error, children }: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {icon && <span className="inline-flex items-center gap-1.5">{icon}{label}</span>}
        {!icon && label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}