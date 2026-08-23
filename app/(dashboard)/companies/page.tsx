import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CompanyList } from "@/components/companies/CompanyList";
import { getCompanies } from "@/actions/companies";

export const metadata: Metadata = { title: "Company Intelligence | JobPilot AI" };

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Company Intelligence" />
      <CompanyList initialCompanies={companies} />
    </div>
  );
}