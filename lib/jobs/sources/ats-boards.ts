import type { NormalizedJob } from "./types";
import { JobSource, RemoteType, EmploymentType } from "@prisma/client";
import { evaluateJobFreshness } from "../freshness";

/**
 * Fetch jobs from a company's public Greenhouse board
 */
export async function fetchGreenhouseJobs(companySlug: string): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(companySlug)}/jobs?content=true`, {
      headers: { "User-Agent": "JobPilot-AI/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((j: {
      id: number;
      title: string;
      location?: { name?: string };
      content?: string;
      updated_at?: string;
      absolute_url: string;
    }) => {
      const datePosted = j.updated_at ? new Date(j.updated_at) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const isRemote = (j.location?.name || "").toLowerCase().includes("remote");

      return {
        title: j.title.trim(),
        companyName: companySlug.charAt(0).toUpperCase() + companySlug.slice(1),
        location: j.location?.name || "Global",
        remoteType: isRemote ? RemoteType.REMOTE : RemoteType.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        description: j.content ? j.content.replace(/<[^>]*>?/gm, "").slice(0, 4000) : j.title,
        requiredSkills: ["Software Engineering"],
        source: JobSource.GREENHOUSE,
        sourceUrl: j.absolute_url,
        sourceJobId: String(j.id),
        applicationUrl: j.absolute_url,
        datePosted,
        freshness: freshness.score,
      };
    });
  } catch (err) {
    console.warn(`[Greenhouse Sourcing Error for ${companySlug}]`, err);
    return [];
  }
}

/**
 * Fetch jobs from a company's public Lever board
 */
export async function fetchLeverJobs(companySlug: string): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}?mode=json`, {
      headers: { "User-Agent": "JobPilot-AI/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((j: {
      id: string;
      text: string;
      descriptionPlain?: string;
      categories?: { location?: string; commitment?: string; team?: string };
      hostedUrl: string;
      applyUrl: string;
      createdAt?: number;
    }) => {
      const datePosted = j.createdAt ? new Date(j.createdAt) : new Date();
      const freshness = evaluateJobFreshness(datePosted);
      const isRemote = (j.categories?.location || "").toLowerCase().includes("remote");

      return {
        title: j.text.trim(),
        companyName: companySlug.charAt(0).toUpperCase() + companySlug.slice(1),
        location: j.categories?.location || "Remote",
        remoteType: isRemote ? RemoteType.REMOTE : RemoteType.HYBRID,
        employmentType: EmploymentType.FULL_TIME,
        description: j.descriptionPlain ? j.descriptionPlain.slice(0, 4000) : j.text,
        requiredSkills: [j.categories?.team || "Engineering"],
        source: JobSource.LEVER,
        sourceUrl: j.hostedUrl,
        sourceJobId: j.id,
        applicationUrl: j.applyUrl || j.hostedUrl,
        datePosted,
        freshness: freshness.score,
      };
    });
  } catch (err) {
    console.warn(`[Lever Sourcing Error for ${companySlug}]`, err);
    return [];
  }
}