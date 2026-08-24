import type { NormalizedJob } from "./types";
import { JobSource, RemoteType, EmploymentType } from "@prisma/client";
import { evaluateJobFreshness } from "../freshness";
import { isLocationMatchingIndia, isRoleMatchingTargets } from "../locations";

const COMMON_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Golang", "Rust",
  "Java", "C++", "C#", ".NET", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "Next.js", "Vue", "Angular",
  "Tailwind", "CI/CD", "Terraform", "FastAPI", "Django", "Flask", "Spring Boot",
  "DevOps", "AI", "LLM", "Machine Learning", "PyTorch", "TensorFlow"
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
 * Fetch jobs from RemoteOK API
 */
export async function fetchRemoteOKJobs(keywords: string[] = []): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobPilot-AI/1.0" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Filter out metadata first item
    const rawJobs = data.slice(1);
    const jobs: NormalizedJob[] = [];

    for (const item of rawJobs.slice(0, 30)) {
      if (!item.position || !item.company) continue;

      const datePosted = item.date ? new Date(item.date) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
      const extractedSkills = extractSkillsFromText(`${item.position} ${tags.join(" ")} ${item.description || ""}`);

      // Filter by keywords if provided
      if (keywords.length > 0) {
        const matchesKeyword = keywords.some((kw) =>
          item.position.toLowerCase().includes(kw.toLowerCase()) ||
          tags.some((t: string) => t.toLowerCase().includes(kw.toLowerCase()))
        );
        if (!matchesKeyword) continue;
      }

      // Role target filter
      if (!isRoleMatchingTargets(item.position || "").matches) {
        continue;
      }

      // Filter for India / Open Global Remote
      if (!isLocationMatchingIndia(item.location || "Remote").matches) {
        continue;
      }

      jobs.push({
        title: item.position.trim(),
        companyName: item.company.trim(),
        location: item.location || "Remote (India & Global)",
        remoteType: RemoteType.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        description: item.description ? item.description.replace(/<[^>]*>?/gm, "").slice(0, 4000) : item.position,
        rawDescription: item.description,
        requiredSkills: extractedSkills.length > 0 ? extractedSkills : ["Software Engineering"],
        salaryMin: item.salary_min ? Number(item.salary_min) : null,
        salaryMax: item.salary_max ? Number(item.salary_max) : null,
        salaryCurrency: "USD",
        salaryText: item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : null,
        source: JobSource.REMOTEOK,
        sourceUrl: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
        sourceJobId: String(item.id || ""),
        applicationUrl: item.apply_url || item.url || `https://remoteok.com/remote-jobs/${item.id}`,
        datePosted,
        freshness: freshness.score,
      });
    }

    return jobs;
  } catch (err) {
    console.warn("[RemoteOK Sourcing Error]", err);
    return [];
  }
}

/**
 * Fetch jobs from Himalayas API
 */
export async function fetchHimalayasJobs(keywords: string[] = []): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://himalayas.app/jobs/api?limit=30", {
      headers: { "User-Agent": "JobPilot-AI/1.0" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs: NormalizedJob[] = [];

    for (const item of data.jobs) {
      if (!item.title || !item.companyName) continue;

      const datePosted = item.pubDate ? new Date(item.pubDate * 1000) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const skills = Array.isArray(item.skills) ? item.skills : [];
      const extractedSkills = Array.from(new Set([...skills, ...extractSkillsFromText(`${item.title} ${item.excerpt || ""}`)]));

      // Role target filter
      if (!isRoleMatchingTargets(item.title || "").matches) {
        continue;
      }

      // Filter for India / Open Global Remote
      const locStr = item.location || (Array.isArray(item.locationRestrictions) ? item.locationRestrictions.join(", ") : "Remote");
      if (!isLocationMatchingIndia(locStr).matches) {
        continue;
      }

      jobs.push({
        title: item.title.trim(),
        companyName: item.companyName.trim(),
        location: locStr || "Remote (India & Global)",
        remoteType: RemoteType.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        description: item.excerpt ? item.excerpt.slice(0, 4000) : item.title,
        requiredSkills: extractedSkills.length > 0 ? extractedSkills : ["Software Engineering"],
        salaryMin: item.minSalary ? Number(item.minSalary) : null,
        salaryMax: item.maxSalary ? Number(item.maxSalary) : null,
        salaryCurrency: item.currency || "USD",
        salaryText: item.minSalary && item.maxSalary ? `${item.currency || "$"}${item.minSalary} - ${item.currency || "$"}${item.maxSalary}` : null,
        source: JobSource.HIMALAYAS,
        sourceUrl: item.applicationLink || `https://himalayas.app/companies/${item.companySlug}/jobs/${item.slug}`,
        sourceJobId: String(item.slug || ""),
        applicationUrl: item.applicationLink || `https://himalayas.app/companies/${item.companySlug}/jobs/${item.slug}`,
        datePosted,
        freshness: freshness.score,
      });
    }

    return jobs;
  } catch (err) {
    console.warn("[Himalayas Sourcing Error]", err);
    return [];
  }
}

/**
 * Fetch jobs from Arbeitnow API
 */
export async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "JobPilot-AI/1.0" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    const jobs: NormalizedJob[] = [];

    for (const item of data.data.slice(0, 25)) {
      if (!item.title || !item.company_name) continue;

      // Role target filter
      if (!isRoleMatchingTargets(item.title || "").matches) {
        continue;
      }

      // Filter for India / Open Global Remote
      if (!isLocationMatchingIndia(item.location || "").matches) {
        continue;
      }

      const datePosted = item.created_at ? new Date(item.created_at * 1000) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
      const extractedSkills = Array.from(new Set([...tags, ...extractSkillsFromText(`${item.title} ${item.description || ""}`)]));

      jobs.push({
        title: item.title.trim(),
        companyName: item.company_name.trim(),
        location: item.location || "Europe / Remote",
        remoteType: item.remote ? RemoteType.REMOTE : RemoteType.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        description: item.description ? item.description.replace(/<[^>]*>?/gm, "").slice(0, 4000) : item.title,
        requiredSkills: extractedSkills.length > 0 ? extractedSkills : ["Engineering"],
        source: JobSource.ARBEITNOW,
        sourceUrl: item.url,
        sourceJobId: item.slug,
        applicationUrl: item.url,
        datePosted,
        freshness: freshness.score,
      });
    }

    return jobs;
  } catch (err) {
    console.warn("[Arbeitnow Sourcing Error]", err);
    return [];
  }
}

/**
 * Aggregate all active open source boards
 */
export async function fetchAllAggregatorJobs(keywords: string[] = []): Promise<NormalizedJob[]> {
  const [remoteOkJobs, himalayasJobs, arbeitnowJobs] = await Promise.all([
    fetchRemoteOKJobs(keywords),
    fetchHimalayasJobs(keywords),
    fetchArbeitnowJobs(),
  ]);

  return [...remoteOkJobs, ...himalayasJobs, ...arbeitnowJobs];
}