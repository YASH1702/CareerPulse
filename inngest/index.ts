import { dailyDigestCron } from "./functions/daily-digest";
import { analyzeJobOnCreate } from "./functions/analyze-job";

export const functions = [
  dailyDigestCron,
  analyzeJobOnCreate,
];