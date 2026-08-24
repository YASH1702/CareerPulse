import { dailyDigestCron } from "./functions/daily-digest";
import { analyzeJobOnCreate } from "./functions/analyze-job";
import { autoScraperCron } from "./functions/auto-scraper";

export const functions = [
  dailyDigestCron,
  analyzeJobOnCreate,
  autoScraperCron,
];