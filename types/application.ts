export type ApplicationStatus =
  | "NEW"
  | "REVIEW"
  | "READY"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationPackage {
  jobId: string;
  jobTitle: string;
  companyName: string;
  matchScore?: number;
  applicationUrl?: string;
  resumeId?: string;
  tailoredResume?: Record<string, unknown>;
  coverLetter?: string;
  checklist: ApplicationChecklistItem[];
  notes?: string;
}

export interface ApplicationChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}
