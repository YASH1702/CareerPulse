import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { getApplications } from "@/actions/applications";

export const metadata: Metadata = { title: "Application Tracker | JobPilot AI" };

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Application Pipeline" />
      <KanbanBoard initialApplications={applications} />
    </div>
  );
}