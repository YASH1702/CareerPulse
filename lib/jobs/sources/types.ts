import type { JobSource, RemoteType, EmploymentType, FreshnessScore } from "@prisma/client";

export interface NormalizedJob {
  title: string;
  companyName: string;
  location?: string | null;
  remoteType: RemoteType;
  employmentType?: EmploymentType;
  description: string;
  rawDescription?: string | null;
  requiredSkills: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryText?: string | null;
  source: JobSource;
  sourceUrl: string;
  sourceJobId?: string | null;
  applicationUrl: string;
  datePosted?: Date | null;
  freshness: FreshnessScore;
  repostCount?: number;
}