import type { ResumeData } from "@/types/resume";

export function formatResumeToRawText(
  data: ResumeData,
  candidateName?: string | null,
  headline?: string | null,
  contactLine?: string | null
): string {
  const parts: string[] = [];
  if (candidateName) parts.push(candidateName.toUpperCase());
  if (headline) parts.push(headline);
  if (contactLine) parts.push(contactLine);

  if (data.summary) {
    parts.push("\nPROFESSIONAL SUMMARY\n" + data.summary);
  }

  const technical = data.skills?.technical || [];
  const soft = data.skills?.soft || [];
  if (technical.length > 0 || soft.length > 0) {
    parts.push("\nTECHNICAL SKILLS");
    if (technical.length > 0) parts.push(`Core Technologies: ${technical.join(", ")}`);
    if (soft.length > 0) parts.push(`Key Strengths: ${soft.join(", ")}`);
  }

  if (data.experience && data.experience.length > 0) {
    parts.push("\nWORK EXPERIENCE");
    data.experience.forEach((exp) => {
      parts.push(`${exp.role} - ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})`);
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((b) => parts.push(`• ${b}`));
      }
    });
  }

  if (data.projects && data.projects.length > 0) {
    parts.push("\nPROJECTS & TECHNICAL ARCHITECTURE");
    data.projects.forEach((proj) => {
      const tech = proj.technologies && proj.technologies.length > 0 ? ` | ${proj.technologies.join(", ")}` : "";
      parts.push(`${proj.name}${tech}`);
      if (proj.description) parts.push(proj.description);
      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach((b) => parts.push(`• ${b}`));
      }
    });
  }

  if (data.education && data.education.length > 0) {
    parts.push("\nEDUCATION");
    data.education.forEach((edu) => {
      parts.push(`${edu.degree} in ${edu.field || "Engineering"} - ${edu.institution} (${edu.startYear || ""} - ${edu.endYear || "Present"})`);
    });
  }

  if (data.certifications && data.certifications.length > 0) {
    parts.push("\nCERTIFICATIONS");
    data.certifications.forEach((c) => {
      parts.push(`${c.name} - ${c.issuer || ""} (${c.year || ""})`);
    });
  }

  return parts.join("\n");
}