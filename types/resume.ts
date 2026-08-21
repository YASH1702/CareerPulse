export interface ResumeExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  bullets: string[];
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  bullets?: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface ResumeData {
  summary?: string;
  skills?: {
    technical?: string[];
    soft?: string[];
    [key: string]: string[] | undefined;
  };
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  education?: ResumeEducation[];
  certifications?: Array<{ name: string; issuer?: string; year?: number }>;
  achievements?: string[];
}
