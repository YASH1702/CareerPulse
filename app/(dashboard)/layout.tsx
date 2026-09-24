import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden print:block print:h-auto print:min-h-0 print:bg-white print:overflow-visible">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto print:block print:w-full print:h-auto print:min-h-0 print:overflow-visible print:p-0 print:m-0">
        <div className="p-6 max-w-[1400px] mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">{children}</div>
      </main>
    </div>
  );
}
