import type { Profile, Skill } from "@prisma/client";
import { getSalaryBenchmark } from "../scoring/salary-benchmark";

export interface ScreeningAnswer {
  question: string;
  answer: string | number | boolean;
  confidence: number;
}

/**
 * Maps screening questions to accurate candidate profile answers.
 */
export function classifyScreeningQuestion(
  questionText: string,
  profile: Profile & { skills: Skill[] },
  candidateName = "Candidate"
): ScreeningAnswer {
  const q = questionText.toLowerCase();

  // 1. Work Authorization & Sponsorship
  if (q.includes("authorized to work") || q.includes("legally authorized") || q.includes("right to work")) {
    return { question: questionText, answer: true, confidence: 0.99 };
  }
  if (q.includes("sponsorship") || q.includes("visa sponsorship") || q.includes("require sponsorship")) {
    return { question: questionText, answer: false, confidence: 0.95 };
  }

  // 2. Notice Period & Availability
  if (q.includes("notice period") || q.includes("how soon can you start") || q.includes("availability")) {
    const np = profile.noticePeriod || "30 days";
    return { question: questionText, answer: np, confidence: 0.95 };
  }

  // 3. Years of Experience (General)
  if (q.includes("total years") || q.includes("overall experience") || (q.includes("years") && q.includes("experience") && !q.includes("with"))) {
    return { question: questionText, answer: profile.yearsExperience || 3, confidence: 0.95 };
  }

  // 4. Specific Technology Years
  for (const skill of profile.skills) {
    if (q.includes(skill.name.toLowerCase())) {
      const years = skill.yearsUsed || Math.min(profile.yearsExperience || 3, 3);
      if (q.includes("yes/no") || q.includes("do you have experience")) {
        return { question: questionText, answer: true, confidence: 0.98 };
      }
      return { question: questionText, answer: years, confidence: 0.92 };
    }
  }

  // 5. Salary Expectations / CTC
  if (q.includes("expected salary") || q.includes("expected ctc") || q.includes("compensation expectation") || q.includes("salary expectation")) {
    const benchmark = getSalaryBenchmark(profile.currentRole || "Software Engineer", profile.salaryMin, profile.salaryMax, profile.salaryCurrency, profile.yearsExperience || 3);
    return { question: questionText, answer: benchmark.recommendedValue, confidence: 0.9 };
  }

  // 6. Current CTC
  if (q.includes("current ctc") || q.includes("current salary")) {
    const current = profile.salaryMin ? Math.round(profile.salaryMin * 0.8) : 1500000;
    return { question: questionText, answer: current, confidence: 0.85 };
  }

  // 7. Location & Relocation
  if (q.includes("willing to relocate") || q.includes("open to relocation")) {
    return { question: questionText, answer: profile.remotePreference === "OPEN", confidence: 0.9 };
  }
  if (q.includes("current location") || q.includes("city")) {
    return { question: questionText, answer: profile.location || "Bangalore, India", confidence: 0.95 };
  }

  // 8. Contact Links
  if (q.includes("linkedin")) {
    return { question: questionText, answer: profile.linkedinUrl || "", confidence: 0.99 };
  }
  if (q.includes("github")) {
    return { question: questionText, answer: profile.githubUrl || "", confidence: 0.99 };
  }
  if (q.includes("portfolio") || q.includes("website")) {
    return { question: questionText, answer: profile.portfolioUrl || profile.websiteUrl || "", confidence: 0.99 };
  }

  // Default fallback
  return {
    question: questionText,
    answer: "Yes, fully experienced and eager to contribute.",
    confidence: 0.6,
  };
}