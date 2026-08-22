import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
export const metadata: Metadata = { title: "Companies | JobPilot AI" };
export default function CompaniesPage() {
  return (
    <div>
      <DashboardHeader title="Companies" />
      <div className="glass-card p-8 text-center text-slate-500">Company tracker coming soon</div>
    </div>
  );
}