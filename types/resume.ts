export interface ResumeExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  location?: string | null;
  bullets: string[];
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string | null;
  bullets?: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  grade?: string | null;
}

export interface ResumeCertification {
  name: string;
  issuer?: string | null;
  year?: number | null;
}

export interface ResumeSkills {
  technical: string[];
  soft: string[];
}

export interface ResumeData {
  summary?: string;
  skills: ResumeSkills;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  achievements: string[];
}