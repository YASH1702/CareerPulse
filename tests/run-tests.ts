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

  console.log("\n=========================================");
  console.log(`   🎉 ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY! `);
  console.log("=========================================\n");
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});