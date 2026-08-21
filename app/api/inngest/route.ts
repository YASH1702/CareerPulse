import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
// Import functions as they are built
// import { analyzeJobFunction } from "@/inngest/functions/analyze-job";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // analyzeJobFunction,
  ],
});
