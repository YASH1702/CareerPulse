import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db/client";

// Allow CORS for local extension
function setCorsHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res);
}

export async function GET(req: NextRequest) {
  try {
    // 1. Try to get authenticated user from session
    const session = await auth();
    let userId = session?.user?.id;

    // 2. If no active session cookie in extension fetch, fallback to primary user
    if (!userId) {
      const primaryUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (primaryUser) {
        userId = primaryUser.id;
      }
    }

    if (!userId) {
      const res = NextResponse.json(
        { error: "No candidate profile found in database" },
        { status: 404 }
      );
      return setCorsHeaders(res);
    }

    // 3. Fetch user and full profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            education: true,
            certifications: true,
          },
        },
        resumes: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || !user.profile) {
      const res = NextResponse.json(
        { error: "Candidate profile not configured" },
        { status: 404 }
      );
      return setCorsHeaders(res);
    }

    const p = user.profile;
    const activeResume = user.resumes && user.resumes.length > 0 ? user.resumes[0] : null;

    // Split name into first and last name
    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Candidate";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Parse location parts
    const locationStr = p.location || "India";
    const locationParts = locationStr.split(",").map((s: string) => s.trim());
    const city = locationParts[0] || "Jaipur";
    const state = locationParts[1] || "Rajasthan";
    const country = locationParts[2] || "India";

    // Format salary in LPA and absolute
    const salaryLPA = p.salaryMin ? Number((p.salaryMin / 100000).toFixed(1)) : 12;
    const salaryAnnual = p.salaryMin || 1200000;

    // Technical skills map with years of experience
    const skillsMap: Record<string, number> = {};
    p.skills.forEach((s: { name: string; yearsUsed: number | null }) => {
      skillsMap[s.name.toLowerCase()] = s.yearsUsed || 2;
    });

    const responseData = {
      success: true,
      candidate: {
        id: user.id,
        fullName: user.name || "Yashwant Kariha",
        firstName,
        lastName,
        email: user.email,
        phone: p.phone || "6375278279",
        phoneFormatted: p.phone?.startsWith("+91") ? p.phone : `+91 ${p.phone || "6375278279"}`,
        phoneCountryCode: "+91",
        headline: p.headline || "Full Stack Web Developer | MERN Stack, React & Next.js",
        bio: p.bio || "",
        currentRole: p.currentRole || "Full Stack Web Developer",
        yearsExperience: p.yearsExperience || 2,
        location: locationStr,
        address: {
          city,
          state,
          country: "India",
          postalCode: "302001",
        },
        links: {
          linkedin: p.linkedinUrl || "https://www.linkedin.com/in/yashwant-kariha-740630207/",
          github: p.githubUrl || "https://github.com/YASH1702",
          portfolio: p.portfolioUrl || "https://vscode-portfolio-main-blush.vercel.app/",
          twitter: "",
        },
        screeningAnswers: {
          workAuthorization: "Yes",
          requireSponsorship: "No",
          legallyAuthorizedToWork: true,
          visaRequired: false,
          noticePeriod: p.noticePeriod || "Immediate / 30 days",
          noticePeriodDays: 30,
          expectedSalaryLPA: `${salaryLPA} LPA`,
          expectedSalaryAnnual: salaryAnnual,
          expectedSalaryFormatted: `₹${salaryAnnual.toLocaleString("en-IN")}`,
          willingToRelocate: "Yes",
          remotePreference: p.remotePreference || "OPEN",
          preferredLocations: p.preferredLocations || ["Bangalore", "Hyderabad", "Pune", "Delhi NCR", "Remote"],
        },
        education: p.education.map((e: { institution: string; degree: string; field: string | null; startYear: number | null; endYear: number | null; grade: string | null }) => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field || "Computer Science",
          startYear: e.startYear || 2022,
          endYear: e.endYear || 2024,
          grade: e.grade || "First Class",
        })),
        skills: p.skills.map((s: { name: string; category: string; proficiency: string; yearsUsed: number | null }) => ({
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
          years: s.yearsUsed || 2,
        })),
        skillsMap,
        activeResume: activeResume
          ? {
              id: activeResume.id,
              name: activeResume.name,
              summary: activeResume.summary,
              rawText: activeResume.rawText,
              fileUrl: activeResume.fileUrl,
              fileName: activeResume.fileName,
              atsScore: activeResume.atsScore,
            }
          : null,
      },
    };

    const res = NextResponse.json(responseData);
    return setCorsHeaders(res);
  } catch (error) {
    console.error("[Extension Profile API Error]:", error);
    const res = NextResponse.json(
      { error: "Failed to fetch candidate profile" },
      { status: 500 }
    );
    return setCorsHeaders(res);
  }
}