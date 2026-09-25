import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { SkillGapAnalysis } from "@/components/analytics/SkillGapAnalysis";
import { ApplicationFunnel } from "@/components/analytics/ApplicationFunnel";
import { ActivityTimeline } from "@/components/analytics/ActivityTimeline";
import { getAnalyticsData } from "@/actions/analytics";

export const metadata: Metadata = { title: "Analytics & Intelligence | CareerPulse" };

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Analytics &amp; Market Intelligence" />

      {/* High-level metrics */}
      <MetricsGrid
        totalJobs={data.totalJobs}
        totalApplied={data.totalApplied}
        totalInterviews={data.totalInterviews}
        totalOffers={data.totalOffers}
        interviewRate={data.interviewRate}
        offerRate={data.offerRate}
        avgMatchScore={data.avgMatchScore}
      />

      {/* Application Funnel */}
      <ApplicationFunnel
        totalJobs={data.totalJobs}
        totalApplied={data.totalApplied}
        totalInterviews={data.totalInterviews}
        totalOffers={data.totalOffers}
      />

      {/* Skill Gap Analysis */}
      <SkillGapAnalysis
        missingSkills={data.missingSkillsList}
        matchedSkills={data.matchedSkillsList}
        totalJobs={data.totalJobs}
      />

      {/* Timeline */}
      <ActivityTimeline events={data.events} />
    </div>
  );
}