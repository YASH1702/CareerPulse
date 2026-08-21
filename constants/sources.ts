export const JOB_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual Entry",
  URL: "URL Import",
  EMAIL_ALERT: "Email Alert",
  API: "API",
  LINKEDIN_MANUAL: "LinkedIn (Manual)",
  NAUKRI_MANUAL: "Naukri (Manual)",
};

export const SUPPORTED_SOURCES = [
  "MANUAL",
  "URL",
  "EMAIL_ALERT",
  "LINKEDIN_MANUAL",
  "NAUKRI_MANUAL",
] as const;
