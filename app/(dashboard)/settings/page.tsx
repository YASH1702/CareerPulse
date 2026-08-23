import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { auth } from "@/auth";
import { User, Key, Bell, Shield, Database, Sparkles, Mail, Server, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings & System Status | JobPilot AI" };

export default async function SettingsPage() {
  const session = await auth();

  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-openai"));
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your-resend"));
  const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("your-upstash"));
  const dbConnected = Boolean(process.env.DATABASE_URL);

  return (
    <div className="space-y-6 max-w-4xl">
      <DashboardHeader title="Settings &amp; System Configuration" />

      {/* Account Info */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{session?.user?.name || "User Account"}</h3>
              <p className="text-xs text-slate-400">{session?.user?.email || "No email available"}</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <span>Edit Profile</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* API Integrations Status */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Integrations &amp; Cloud Services Status</h3>
        </div>
        <p className="text-xs text-slate-400">
          JobPilot AI is architected with graceful degradation. Missing keys automatically switch to deterministic fallback logic without crashing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Database */}
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database size={15} className="text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-white">Neon PostgreSQL</p>
                <p className="text-[11px] text-slate-500">Database &amp; Prisma v7</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              dbConnected
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/15 text-red-400 border-red-500/30"
            }`}>
              {dbConnected ? "Connected" : "Not Set"}
            </span>
          </div>

          {/* OpenAI */}
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles size={15} className="text-purple-400" />
              <div>
                <p className="text-xs font-semibold text-white">OpenAI (GPT-4o)</p>
                <p className="text-[11px] text-slate-500">Semantic match &amp; tailoring</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              openAIConfigured
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
            }`}>
              {openAIConfigured ? "Active (AI Mode)" : "Fallback Active"}
            </span>
          </div>

          {/* Resend */}
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={15} className="text-indigo-400" />
              <div>
                <p className="text-xs font-semibold text-white">Resend Email</p>
                <p className="text-[11px] text-slate-500">Daily digest &amp; alerts</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              resendConfigured
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-slate-500/15 text-slate-400 border-slate-500/30"
            }`}>
              {resendConfigured ? "Active" : "In-App Only"}
            </span>
          </div>

          {/* Upstash Redis */}
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server size={15} className="text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-white">Upstash Redis</p>
                <p className="text-[11px] text-slate-500">Caching &amp; rate limiting</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              redisConfigured
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-slate-500/15 text-slate-400 border-slate-500/30"
            }`}>
              {redisConfigured ? "Active" : "Memory Fallback"}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Rules */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Automations &amp; Notification Rules</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Daily Job Search Digest</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Automated morning summary of 75%+ matching roles discovered for you.</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
              8:00 AM Daily
            </span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Application Follow-Up Nudges</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Flags applications submitted &gt;7 days ago without an interview scheduled.</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
              7-Day Trigger
            </span>
          </div>
        </div>
      </div>

      {/* Security & System Info */}
      <div className="glass-card p-6 space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">Security &amp; Data Policies</h3>
        </div>
        <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
          <li><strong>Zero Hallucination Guarantee:</strong> Resumes and cover letters are strictly verified against your master profile.</li>
          <li><strong>No Web Scraping:</strong> All job ingestion is through manual entry, paste, or official APIs.</li>
          <li><strong>Manual Final Action:</strong> Applications are submitted directly by you on the official employer portal.</li>
          <li><strong>Encrypted Connections:</strong> Neon Postgres connects over enforced SSL/TLS.</li>
        </ul>
      </div>
    </div>
  );
}