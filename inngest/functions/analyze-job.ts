import { inngest } from "@/inngest/client";
import { analyzeJobCompatibility } from "@/lib/ai/analyze-job";

export const analyzeJobOnCreate = inngest.createFunction(
  {
    id: "analyze-job-on-create",
    name: "Analyze Job Compatibility on Import",
    triggers: [{ event: "job/created" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { jobId, userId } = event.data;

    return await step.run("run-compatibility-analysis", async () => {
      return await analyzeJobCompatibility(jobId, userId);
    });
  }
);