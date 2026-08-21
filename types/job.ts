export interface NormalizedJob {
  title: string;
  companyName: string;
  location?: string;
  remoteType?: "REMOTE" | "HYBRID" | "ONSITE" | "UNSPECIFIED";
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP";
  description?: string;
  rawDescription?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  experienceRequired?: string;
  educationRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryText?: string;
  benefits?: string[];
  source: string;
  sourceUrl?: string;
  sourceJobId?: string;
  applicationUrl?: string;
  datePosted?: Date;
}

export interface JobFilters {
  status?: string;
  matchScore?: { min?: number; max?: number };
  source?: string;
  role?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  datePostedAfter?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}
