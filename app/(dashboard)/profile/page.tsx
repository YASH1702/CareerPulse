import { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BasicInfoForm } from "@/components/profile/BasicInfoForm";
import { SkillsPanel } from "@/components/profile/SkillsPanel";
import { JobPrefsForm } from "@/components/profile/JobPrefsForm";
import { EducationPanel } from "@/components/profile/EducationPanel";
import { LinkedInImportModal } from "@/components/profile/LinkedInImportModal";
import { getProfile } from "@/actions/profile";

export const metadata: Metadata = { title: "Profile | CareerPulse" };

const TABS = [
  { id: "basic", label: "Basic Info" },
  { id: "skills", label: "Skills" },
  { id: "prefs", label: "Job Preferences" },
  { id: "education", label: "Education" },
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getProfile();
  if (!user) redirect("/signin");

  const params = await searchParams;
  const tab = params.tab ?? "basic";

  const profile = user.profile;
  const skills = profile?.skills ?? [];
  const education = profile?.education ?? [];

  // Profile completeness score
  const checks = [
    !!user.name,
    !!profile?.headline,
    !!profile?.location,
    !!profile?.bio,
    skills.length > 0,
    education.length > 0,
    (profile?.targetRoles?.length ?? 0) > 0,
    !!profile?.linkedinUrl || !!profile?.githubUrl,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <DashboardHeader title="Your Profile" />
        <LinkedInImportModal />
      </div>

      {/* Completeness bar */}
      <div className="glass-card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-slate-400">Profile completeness</span>
            <span className={`text-sm font-semibold ${completeness >= 80 ? "text-emerald-400" : completeness >= 50 ? "text-blue-400" : "text-amber-400"}`}>
              {completeness}%
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
        {completeness < 100 && (
          <p className="text-xs text-slate-500 shrink-0">
            {100 - completeness}% to go
          </p>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {TABS.map(({ id, label }) => (
          <a key={id} href={`/profile?tab=${id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}>
            {label}
          </a>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass-card p-6">
        {tab === "basic" && <BasicInfoForm user={user as Parameters<typeof BasicInfoForm>[0]["user"]} />}
        {tab === "skills" && <SkillsPanel skills={skills} />}
        {tab === "prefs" && <JobPrefsForm profile={profile} />}
        {tab === "education" && <EducationPanel education={education} />}
      </div>
    </div>
  );
}