import * as cheerio from "cheerio";
import type { NormalizedJob } from "./types";
import { JobSource, RemoteType, EmploymentType } from "@prisma/client";
import { evaluateJobFreshness } from "../freshness";

const COMMON_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Rust",
  "Java", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Next.js", "GraphQL",
  "Tailwind", "CI/CD", "FastAPI", "DevOps", "AI", "LLM"
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSkillsFromText(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const skill of COMMON_SKILLS) {
    const escaped = escapeRegex(skill.toLowerCase());
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }
  return Array.from(found);
}

/**
 * Scrapes fresh LinkedIn jobs using LinkedIn's public guest search API (No login/cookies required).
 */
export async function fetchLinkedInGuestJobs(
  keywords = "Software Engineer",
  location = "Remote",
  limit = 20
): Promise<NormalizedJob[]> {
  try {
    const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      keywords
    )}&location=${encodeURIComponent(location)}&f_TPR=r86400&start=0`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[LinkedIn Guest Scraper] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: NormalizedJob[] = [];

    const items = $("li").toArray();

    for (const el of items.slice(0, limit)) {
      const title = $(el).find(".base-search-card__title").text().trim();
      const company = $(el).find(".base-search-card__subtitle").text().trim();
      const loc = $(el).find(".job-search-card__location").text().trim();
      const link = $(el).find(".base-card__full-link").attr("href") || "";
      const timeStr = $(el).find("time").attr("datetime") || $(el).find("time").text().trim();

      if (!title || !company) continue;

      // Extract Job ID from URL (e.g. /jobs/view/123456789 or /jobs/view/title-123456789)
      const jobIdMatch = link.match(/\/view\/(?:.*-)?([0-9]+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : null;

      const datePosted = timeStr ? new Date(timeStr) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const extractedSkills = extractSkillsFromText(title);

      const isRemote = loc.toLowerCase().includes("remote") || location.toLowerCase().includes("remote");

      jobs.push({
        title,
        companyName: company,
        location: loc || location,
        remoteType: isRemote ? RemoteType.REMOTE : RemoteType.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        description: `Role: ${title} at ${company}. Location: ${loc}. Direct application link on LinkedIn.`,
        requiredSkills: extractedSkills.length > 0 ? extractedSkills : ["Software Development"],
        source: JobSource.LINKEDIN,
        sourceUrl: link.split("?")[0] || `https://www.linkedin.com/jobs/view/${jobId}`,
        sourceJobId: jobId,
        applicationUrl: link.split("?")[0] || `https://www.linkedin.com/jobs/view/${jobId}`,
        datePosted,
        freshness: freshness.score,
      });
    }

    return jobs;
  } catch (err) {
    console.warn("[LinkedIn Guest Scraper Error]", err);
    return [];
  }
}