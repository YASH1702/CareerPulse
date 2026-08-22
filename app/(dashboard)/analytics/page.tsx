import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
export const metadata: Metadata = { title: "Analytics | JobPilot AI" };
export default function AnalyticsPage() {
  return (
    <div>
      <DashboardHeader title="Analytics" />
      <div className="glass-card p-8 text-center text-slate-500">Analytics dashboard coming soon</div>
    </div>
  );
}