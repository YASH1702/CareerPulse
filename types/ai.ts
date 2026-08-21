export interface AIMatchResult {
  matchScore: number;
  recommendation: "APPLY" | "CONSIDER" | "SKIP";
  confidence: number;
  category: "EXCELLENT" | "STRONG" | "GOOD" | "WEAK" | "POOR";
  scores: {
    technical: number;
    experience: number;
    role: number;
    location: number;
    salary: number;
    employmentType: number;
    careerGrowth: number;
  };
  strengths: string[];
  missingSkills: string[];
  concerns: string[];
  matchedRequirements: string[];
  unmatchedRequirements: string[];
  whyApply?: string;
  modelUsed?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostUsd?: number;
}

export interface AIJobExtraction {
  title: string;
  companyName: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
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
  applicationUrl?: string;
  datePosted?: string;
}
