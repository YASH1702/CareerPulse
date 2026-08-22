import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { JobList } from "@/components/jobs/JobList";
import { getJobs } from "@/actions/jobs";

export const metadata: Metadata = { title: "Job Opportunities | JobPilot AI" };

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Job Opportunities" />
      <JobList initialJobs={jobs} />
    </div>
  );
}