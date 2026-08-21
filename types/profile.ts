export interface ProfileData {
  id: string;
  userId: string;
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  headline?: string;
  bio?: string;
  currentRole?: string;
  yearsExperience?: number;
  preferredLocations: string[];
  remotePreference: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  noticePeriod?: string;
  targetRoles: string[];
  excludedRoles: string[];
  excludedLocations: string[];
  excludedKeywords: string[];
  priorityKeywords: string[];
  minMatchScore: number;
  skills: SkillData[];
  education: EducationData[];
  certifications: CertificationData[];
}

export interface SkillData {
  id: string;
  name: string;
  category: string;
  proficiency: string;
  yearsUsed?: number;
}

export interface EducationData {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface CertificationData {
  id: string;
  name: string;
  issuer?: string;
  year?: number;
  url?: string;
}
