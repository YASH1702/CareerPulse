# ✈️ JobPilot AI — Automated Job Application & Search Intelligence

> An AI-powered co-pilot that scans, matches, tailors resumes, writes high-conversion cover letters, and tracks your job search pipeline end-to-end with strict anti-hallucination accuracy.

---

## 🌟 Key Features

- **🔐 NextAuth v5 Authentication:** Secure credential sign-up, sign-in, and protected dashboard routing.
- **📄 Master Resume Manager:** Drop your PDF or DOCX resume to automatically parse skills, experiences, projects, and education into structured data.
- **💼 Multi-Mode Job Ingestion:**
  - **AI Fast Parse:** Paste any raw job description or LinkedIn/portal post to extract title, company, skills, remote type, and salary.
  - **Manual Entry:** Comprehensive form with auto-deduplication using SHA-256 content hashing.
- **🛡️ Deterministic Pre-Filtering:** Filters out excluded keywords, conflicting remote preferences, or below-target salaries before running AI.
- **🧠 2-Pass AI Matching Engine:** Calculates weighted match scores (0–100%) against your verified background, highlighting strengths, missing skills, concerns, and a concise "Why Apply" summary.
- **📝 Job-Targeted Resume Tailoring:** Rewrites summary and experience bullets to match target requirements while **strictly verifying that no false companies or skills are hallucinated**.
- **✉️ Dynamic Cover Letter Generator:** Crafts customized, high-conversion cover letters with tone controls (*Professional*, *Startup*, *Enthusiastic*, *Executive*).
- **📋 Interactive Application Kanban:** Track applications through *Ready to Apply*, *Applied*, *Interviewing*, *Offer Received 🎉*, and *Archived*, complete with audit trails.
- **📊 Analytics & Market Skill Gap Radar:** Conversion funnel rates, response rates, and frequency analysis of the top missing skills in your target job market.
- **🏢 Company Intelligence:** Track target companies with sentiment tags (*Priority*, *Neutral*, *Avoid*), recruiter notes, and linked jobs.
- **🖨️ ATS Resume Print View:** Standardized, ATS-compliant single-page resume layout ready for 1-click browser Print to PDF.
- **⏰ Scheduled Automations & Digests:** Inngest cron functions for daily 8:00 AM match digests and application follow-up reminders.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Actions, React 19) |
| **Database** | PostgreSQL (Neon Serverless, PG Driver Adapter) |
| **ORM** | Prisma v7 (`@prisma/adapter-pg` + `pg`) |
| **Authentication** | NextAuth.js v5 (Credentials + bcryptjs) |
| **AI Models** | OpenAI GPT-4o (Deep matching & tailoring) + GPT-4o-mini (Extraction & Cover Letters) |
| **Caching & Rate Limiting**| Upstash Redis (`@upstash/redis` & `@upstash/ratelimit`) |
| **Automation** | Inngest background functions & scheduled crons |
| **Email** | Resend + React Email |
| **Styling** | Tailwind CSS v4 + Lucide Icons + Dark Glassmorphism UI |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- OpenAI API Key (optional for AI matching/parsing; deterministic fallback included)

### 2. Setup Environment Variables
Create a `.env.local` file in the `jobpilot-ai` root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth
AUTH_SECRET="your-32-byte-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Optional: Upstash Redis (for caching & rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: Resend (for email digests)
RESEND_API_KEY=""
```

### 3. Install Dependencies & Migrate Database
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing

Run the automated test suite covering scoring weights, pre-filters, deduplication hashing, and AI safety guards:
```bash
npm test
```

To build for production:
```bash
npm run build
```

---

## 🚢 Production Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set your environment variables in Vercel Project Settings (`DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`).
4. Set the Root Directory to `jobpilot-ai` if monorepo, or leave default.
5. Deploy! 🚀