import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AutoApplySettings } from "@/components/auto-apply/AutoApplySettings";
import { AutoApplyQueue } from "@/components/auto-apply/AutoApplyQueue";
import { getAutoApplyConfigAction, getAutoApplyQueueAction } from "@/actions/auto-apply";

export const metadata: Metadata = { title: "Autonomous Auto-Apply Hub | CareerPulse" };

export default async function AutoApplyPage() {
  const [config, queue] = await Promise.all([
    getAutoApplyConfigAction(),
    getAutoApplyQueueAction(),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      <DashboardHeader title="Autonomous Auto-Apply Hub &amp; Live Queue" />

      {/* Settings Panel */}
      <AutoApplySettings initialConfig={config} />

      {/* Live Queue */}
      <AutoApplyQueue initialQueue={queue} />
    </div>
  );
}