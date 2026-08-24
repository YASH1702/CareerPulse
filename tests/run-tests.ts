import { calculateWeightedMatchScore, getMatchCategoryFromScore } from "../lib/scoring/weights";
import { calculateKeywordOverlap } from "../lib/scoring/rank";
import { evaluateJobPreFilters } from "../lib/jobs/filter";
import { generateJobHash } from "../utils/hash";
import { validateMatchResult, validateTailoredResume } from "../lib/ai/safety";
import type { Job, Profile, Skill, TargetCompany } from "@prisma/client";
import type { AIMatchResult } from "@/types/ai";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runAllTests() {
  console.log("\n=========================================");
  console.log("   🧪 RUNNING JOBPILOT AI TEST SUITE     ");
  console.log("=========================================\n");

  // ─── 1. Scoring Calculations ───────────────────
  console.log("--- Test Group 1: Scoring Weights & Rank ---");
  const score1 = calculateWeightedMatchScore({
    technical: 100,
    experience: 100,
    role: 100,
    location: 100,
    salary: 100,
    careerGrowth: 100,
  });
  assert(score1 === 100, "Perfect scores equal 100%");

  const score2 = calculateWeightedMatchScore({
    technical: 80,
    experience: 70,
    role: 90,
    location: 100,
    salary: 80,
    careerGrowth: 60,
  });
  assert(score2 >= 75 && score2 <= 85, `Weighted score ${score2} matches expected calculation`);

  assert(getMatchCategoryFromScore(95) === "EXCELLENT", "95% maps to EXCELLENT");
  assert(getMatchCategoryFromScore(82) === "STRONG", "82% maps to STRONG");
  assert(getMatchCategoryFromScore(73) === "GOOD", "73% maps to GOOD");
  assert(getMatchCategoryFromScore(55) === "POOR", "55% maps to POOR");

  const overlap = calculateKeywordOverlap(
    ["React", "TypeScript", "Next.js", "Docker"],
    [{ name: "React" }, { name: "TypeScript" }, { name: "Node.js" }] as Skill[]
  );
  assert(overlap.matchedSkills.length === 2, "Matched exactly 2 skills (React, TypeScript)");
  assert(overlap.missingSkills.length === 2, "Identified 2 missing skills (Next.js, Docker)");
  assert(overlap.overlapPercentage === 50, "Calculated 50% keyword overlap");

  // ─── 2. Deterministic Pre-Filtering ────────────
  console.log("\n--- Test Group 2: Deterministic Pre-Filtering ---");

  const mockJob: Parameters<typeof evaluateJobPreFilters>[0] = {
    title: "Senior WordPress Developer",
    companyName: "Acme Corp",
    location: "Pune",
    remoteType: "ONSITE",
    description: "Looking for PHP and WordPress expert",
    requiredSkills: ["PHP", "WordPress"],
    salaryMax: 600000,
  };

  const mockProfile: Parameters<typeof evaluateJobPreFilters>[1] = {
    id: "p1",
    userId: "u1",
    phone: null,
    location: "Pune",
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    websiteUrl: null,
    headline: "Frontend Engineer",
    bio: null,
    currentRole: "Frontend Dev",
    yearsExperience: 3,
    employmentTypes: ["FULL_TIME"],
    preferredLocations: ["Pune"],
    remotePreference: "REMOTE_ONLY",
    salaryMin: 1200000,
    salaryMax: 2000000,
    salaryCurrency: "INR",
    noticePeriod: "30 days",
    availability: null,
    targetRoles: ["Frontend Developer"],
    excludedRoles: ["WordPress"],
    excludedLocations: [],
    excludedKeywords: ["PHP", "WordPress"],
    priorityKeywords: ["React"],
    minMatchScore: 70,
    educationLevel: null,
    profileCompleteness: 80,
    updatedAt: new Date(),
    createdAt: new Date(),
    skills: [{ id: "s1", profileId: "p1", name: "React", category: "FRAMEWORK", proficiency: "ADVANCED", yearsUsed: 3 }],
    targetCompanies: [],
  };

  const filterRes1 = evaluateJobPreFilters(mockJob, mockProfile);
  assert(filterRes1.isFiltered === true, "Excluded keyword job correctly filtered out");
  assert(Boolean(filterRes1.filterReason?.includes("PHP") || filterRes1.filterReason?.includes("WordPress")), "Filter reason correctly mentions excluded keyword");

  // Test passed filter
  const cleanJob: Parameters<typeof evaluateJobPreFilters>[0] = {
    title: "Frontend Engineer",
    companyName: "Google",
    location: "Remote",
    remoteType: "REMOTE",
    description: "Building React applications",
    requiredSkills: ["React", "TypeScript"],
    salaryMax: 2500000,
  };
  const filterRes2 = evaluateJobPreFilters(cleanJob, mockProfile);
  assert(filterRes2.isFiltered === false, "Clean compliant job passes all pre-filters");

  // ─── 3. Deduplication Hashing ──────────────────
  console.log("\n--- Test Group 3: Deduplication Hashing ---");

  const hash1 = generateJobHash({
    companyName: "Google LLC",
    title: "Staff Software Engineer",
    location: "Mountain View, CA",
    applicationUrl: "https://careers.google.com/jobs/123",
  });

  const hash2 = generateJobHash({
    companyName: "  google llc  ",
    title: "staff software engineer",
    location: "Mountain View, CA",
    applicationUrl: "https://careers.google.com/jobs/123",
  });

  assert(hash1 === hash2, "Whitespace and case variations produce identical SHA-256 hash");

  // ─── 4. AI Safety Guards ───────────────────────
  console.log("\n--- Test Group 4: AI Safety & Anti-Hallucination Guards ---");

  const rawAiResult: AIMatchResult = {
    matchScore: 85,
    recommendation: "APPLY",
    confidence: 0.9,
    category: "STRONG",
    scores: { technical: 85, experience: 80, role: 90, location: 100, salary: 80, employmentType: 90, careerGrowth: 80 },
    strengths: [
      "Candidate has strong verified experience in React",
      "Candidate is an expert in Kubernetes and Rust", // Hallucinated!
    ],
    missingSkills: ["Docker"],
    concerns: [],
    matchedRequirements: ["React"],
    unmatchedRequirements: ["Docker"],
  };

  const safeResult = validateMatchResult(rawAiResult, { names: ["React", "TypeScript"] });
  assert(safeResult.strengths.length === 1, "Hallucinated Kubernetes/Rust strength was stripped");
  assert(safeResult.strengths[0].includes("React"), "Verified React strength was preserved");

  const tailoredCheck = validateTailoredResume(
    { experience: [{ company: "Fake Company Never Worked At" }] },
    { experience: [{ company: "Real Company A" }, { company: "Real Company B" }] }
  );
  assert(tailoredCheck.valid === false, "Detected and blocked hallucinated company in tailored resume");

  // ─── 5. Ghost Job & Freshness Analyzer ─────────
  console.log("\n--- Test Group 5: Ghost Job & Freshness Analyzer ---");
  const { evaluateJobFreshness } = await import("../lib/jobs/freshness");
  
  const freshJob = evaluateJobFreshness(new Date());
  assert(freshJob.score === "FRESH", "Job posted today flagged as FRESH (<48h)");
  assert(freshJob.callbackMultiplier > 3, "Fresh job provides >3x callback multiplier");

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 45);
  const staleJob = evaluateJobFreshness(staleDate, 4);
  assert(staleJob.score === "STALE_GHOST", "Job posted 45d ago with 4 reposts flagged as STALE_GHOST");

  // ─── 6. Screening Question Classifier ─────────
  console.log("\n--- Test Group 6: Screening Question Classifier ---");
  const { classifyScreeningQuestion } = await import("../lib/auto-apply/field-classifier");

  const mockProfileWithSkills = {
    ...mockProfile,
    skills: [
      { id: "s1", profileId: "p1", name: "React", category: "FRAMEWORK" as const, proficiency: "ADVANCED" as const, yearsUsed: 3 },
      { id: "s2", profileId: "p1", name: "TypeScript", category: "LANGUAGE" as const, proficiency: "ADVANCED" as const, yearsUsed: 3 },
    ],
  };

  const q1 = classifyScreeningQuestion("Are you legally authorized to work in India?", mockProfileWithSkills);
  assert(q1.answer === true, "Work authorization answered as TRUE");

  const q2 = classifyScreeningQuestion("Will you require visa sponsorship?", mockProfileWithSkills);
  assert(q2.answer === false, "Visa sponsorship answered as FALSE");

  const q3 = classifyScreeningQuestion("What is your notice period in days?", mockProfileWithSkills);
  assert(q3.answer === "30 days", "Notice period answered from candidate profile");

  const q4 = classifyScreeningQuestion("How many years of experience do you have with React?", mockProfileWithSkills);
  assert(Number(q4.answer) >= 3, "React years of experience accurately mapped");

  // ─── 7. Salary Benchmarking & Advisor ──────────
  console.log("\n--- Test Group 7: Salary Benchmarking & Negotiation ---");
  const { getSalaryBenchmark } = await import("../lib/scoring/salary-benchmark");

  const salaryAdv = getSalaryBenchmark("Frontend Engineer", 2000000, 3000000, "INR", 4);
  assert(salaryAdv.recommendedValue >= 2500000 && salaryAdv.recommendedValue <= 2800000, "Calculated 70th percentile anchor for declared salary range");
  assert(salaryAdv.confidence === "HIGH", "Disclosed salary band has HIGH confidence");

  // ─── 8. Inbound Email Classifier ──────────────
  console.log("\n--- Test Group 8: Inbound Email Auto-Tracker ---");
  const { classifyInboundEmail } = await import("../lib/email/classifier");

  const email1 = classifyInboundEmail("Invitation to Interview: Senior Frontend Developer at Stripe", "Hi! We would love to schedule a 30-min technical screen with our team.");
  assert(email1.category === "INTERVIEW_INVITATION", "Classified interview invitation correctly");

  const email2 = classifyInboundEmail("Thank you for applying to OpenAI", "We have received your application for Software Engineer and our team is reviewing it.");
  assert(email2.category === "APPLICATION_CONFIRMATION", "Classified application confirmation correctly");

  const email3 = classifyInboundEmail("Update on your application at Acme", "Unfortunately, after careful consideration we have decided to pursue other candidates.");
  assert(email3.category === "REJECTION", "Classified rejection email correctly");

  console.log("\n=========================================");
  console.log(`   🎉 ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY! `);
  console.log("=========================================\n");
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});