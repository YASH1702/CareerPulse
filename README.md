# JobPilot AI

> Find the right jobs. Apply smarter.

A production-quality personal AI job application agent that finds relevant jobs, analyzes your fit, tailors your resume, generates cover letters, and tracks applications — all in one place.

## Features

- AI job matching with semantic understanding
- Resume tailoring (truthful, never fabricates)
- Cover letter generation
- Application tracker (Kanban)
- Daily job digest
- Skill gap analysis
- Analytics dashboard

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth v5
- **AI**: OpenAI GPT-4o
- **Background Jobs**: Inngest
- **Cache**: Upstash Redis
- **Storage**: Supabase Storage
- **Email**: Resend
- **Deployment**: Vercel

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd jobpilot-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. You need:
- A Neon PostgreSQL database URL
- An OpenAI API key
- Supabase project (for file storage)
- Resend API key (for email)
- Inngest account (for background jobs)
- Upstash Redis (for caching)

Get AUTH_SECRET with:
```bash
openssl rand -base64 32
```

### 3. Set up database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run development server

```bash
npm run dev
```

Open http://localhost:3000

## Development Phases

See [TODO.md](./TODO.md) for detailed progress.

| Phase | Status |
|---|---|
| 0: Architecture | Complete |
| 1: Foundation | Complete |
| 2: Authentication | Pending |
| 3: Profile | Pending |
| 4: Resume Management | Pending |
| ... | ... |

## AI Safety

This application enforces strict truthfulness:
- Never invents skills or experience
- Never fabricates companies or projects
- All AI output is validated against your real profile
- Resume tailoring only reorganizes existing content

## License

Personal use. Not licensed for distribution.
