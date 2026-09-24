const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateDb() {
  const newPortfolioUrl = 'https://portfolio3-ial7sxdz4-yashwants-projects-ec1ef74c.vercel.app/';

  // 1. Update Profile portfolioUrl
  const profileUpdate = await prisma.profile.updateMany({
    data: {
      portfolioUrl: newPortfolioUrl,
    }
  });
  console.log('Profiles updated in DB:', profileUpdate.count);

  const updatedProjects = [
    {
      name: 'CareerPulse - Career Application Copilot & Extension using Next.js, TypeScript, PostgreSQL, OpenAI',
      bullets: [
        'Engineered an automated application platform with intelligent resume tailoring, ATS scoring, and multi-source job tracking.',
        'Developed a Manifest V3 Chrome extension for 1-click form autofill and real-time application tracking across career portals.'
      ],
      description: 'Career Application Copilot & Extension using Next.js, TypeScript, PostgreSQL, OpenAI.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'OpenAI', 'Chrome Extension', 'Tailwind CSS']
    },
    {
      name: 'TaskForge - Event-Driven Workflow Automation Engine using Next.js, TypeScript, OpenAI, Prisma, PostgreSQL',
      bullets: [
        'Built AI-powered workflows to automate repetitive business tasks with asynchronous background job processing.',
        'Developed responsive dashboards with authentication and automated workflows.'
      ],
      description: 'Event-Driven Workflow Automation Engine using Next.js, TypeScript, OpenAI, Prisma, and PostgreSQL.',
      technologies: ['Next.js', 'TypeScript', 'OpenAI API', 'Prisma', 'PostgreSQL']
    },
    {
      name: 'CoreDesk - Business Operations & Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB, Stripe',
      bullets: [
        'Architected a subscription platform with Stripe integration, recurring billing, webhooks, and role-based access control.',
        'Implemented an encrypted credential and password management vault with PBKDF2 hashing and secure MongoDB CRUD workflows.'
      ],
      description: 'Business Operations & Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB, Stripe.',
      technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'MongoDB', 'Stripe', 'PBKDF2']
    }
  ];

  const updatedSkills = {
    frontend: 'React.js, Next.js, TypeScript, JavaScript, Tailwind CSS, Redux Toolkit, Zustand, Material UI, HTML5, CSS3',
    backend: 'Node.js, Express.js, RESTful APIs, JWT Authentication, WebSockets (Socket.io), Stripe API',
    databases: 'PostgreSQL, MongoDB, Prisma ORM, Mongoose, MySQL',
    tools: 'Git, GitHub, Postman, Vite, Figma',
    cloud: 'Docker, AWS, Linux, CI/CD Pipelines, DevOps Fundamentals',
    other: 'OpenAI API / AI Integration, Web Security (PBKDF2/CORS), Performance Optimization',
    technical: [
      'React.js', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Redux Toolkit', 'Zustand', 'Material UI', 'HTML5', 'CSS3',
      'Node.js', 'Express.js', 'RESTful APIs', 'JWT Authentication', 'WebSockets', 'Socket.io', 'Stripe API',
      'PostgreSQL', 'MongoDB', 'Prisma ORM', 'Mongoose', 'MySQL',
      'Git', 'GitHub', 'Postman', 'Vite', 'Figma',
      'Docker', 'AWS', 'Linux', 'CI/CD Pipelines', 'DevOps Fundamentals',
      'OpenAI API', 'Web Security Practices', 'PBKDF2', 'Performance Optimization', 'Python', 'Django'
    ],
    soft: [
      'Web Security Practices',
      'DevOps Fundamentals',
      'Cross-platform Development',
      'Problem Solving',
      'Rapid Prototyping',
      'Team Collaboration'
    ]
  };

  const updatedSummary = 'Full-Stack Developer with 1+ years of professional experience building responsive, secure, and scalable web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL/MongoDB. Experienced in RESTful API architecture, Tailwind CSS, Stripe payment workflows, and production AI-powered tools.';

  // 2. Update all master resumes
  const resumes = await prisma.resume.findMany();

  for (const r of resumes) {
    const rawText = `YASHWANT KARIHA
+91 6375278279 | yashwantkariha1@gmail.com | LinkedIn | GitHub | Portfolio: ${newPortfolioUrl}

PROFESSIONAL SUMMARY
${updatedSummary}

TECHNICAL SKILLS
Frontend : ${updatedSkills.frontend}
Backend : ${updatedSkills.backend}
Databases & ORM : ${updatedSkills.databases}
Tools & Platforms : ${updatedSkills.tools}
Cloud & DevOps : ${updatedSkills.cloud}
Specialized : ${updatedSkills.other}

EXPERIENCE
GYMYAK Pvt. Ltd. - Frontend / Full Stack Developer | June 2024 – Aug 25
• Delivered and maintained the e-commerce website, improving load speed by ~20%.
• Converted Figma designs into a responsive interface with React + Tailwind CSS.
• Linked backend APIs via Node.js, MongoDB, and Axios to enable core features.
• Tech Stack: React, Tailwind CSS, Figma, Node.js, MongoDB, Axios, Javascript, HTML, CSS

Grras Solutions Pvt. Ltd. - Python Web Developer Intern | Jan 2022 – Jun 22
• Constructed efficient APIs leveraging Django and PostgreSQL for interactive applications.
• Achieved 30% faster query execution through indexing and caching on high-load database endpoints.
• Delivered interactive CRUD solutions that improved reporting workflows and overall client satisfaction.
• Tech Stack: Python, Django, PostgreSQL, RESTful APIs

PROJECTS ( CLIENT & ACADEMIC )
CareerPulse - Career Application Copilot & Extension using Next.js, TypeScript, PostgreSQL, OpenAI
• Engineered an automated application platform with intelligent resume tailoring, ATS scoring, and multi-source job tracking.
• Developed a Manifest V3 Chrome extension for 1-click form autofill and real-time application tracking across career portals.

TaskForge - Event-Driven Workflow Automation Engine using Next.js, TypeScript, OpenAI, Prisma, PostgreSQL
• Built AI-powered workflows to automate repetitive business tasks with asynchronous background job processing.
• Developed responsive dashboards with authentication and automated workflows.

CoreDesk - Business Operations & Subscription Platform using Next.js, TypeScript, Tailwind CSS, MongoDB, Stripe
• Architected a subscription platform with Stripe integration, recurring billing, webhooks, and role-based access control.
• Implemented an encrypted credential and password management vault with PBKDF2 hashing and secure MongoDB CRUD workflows.

EDUCATION
KSV University | Aug 2022 – Jun 2024 | Gandhinagar, Gujarat
Master of Science in Information Technology - 8.0 CGPA

JECRC University | Jul 2019 – Jun 2022 | Jaipur, Rajasthan
Bachelor of Computer Applications - 8.20 CGPA

Senior Secondary RBSE (12th) – 84.33% | 2018-2019 | Kekri, Rajasthan
Secondary RBSE (10th) – 85% | 2016-2017 | Kekri, Rajasthan

ADDITIONAL INFORMATION
Achievements: Secured 3rd place in IDEATHON among 25+ teams by building a full-stack solution in 24 hrs.
Courses: Web Development Bootcamp (Udemy), 100x devs Cohort.`;

    await prisma.resume.update({
      where: { id: r.id },
      data: {
        summary: updatedSummary,
        projects: updatedProjects,
        skills: updatedSkills,
        rawText,
      }
    });
    console.log('Successfully updated resume in DB:', r.id, r.name);
  }
}

updateDb().catch(console.error).finally(() => pool.end());
