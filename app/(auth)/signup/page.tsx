"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Zap,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { signUpAction, type ActionResult } from "@/actions/auth";

const initialState: ActionResult = { success: false };

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState
  );

  return (
    <div className="glass-card p-8 w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">JobPilot AI</span>
        </Link>
        <h1 className="text-xl font-semibold text-white">Create your account</h1>
        <p className="text-slate-400 text-sm mt-1">
          Start your smarter job search
        </p>
      </div>

      {/* Global error */}
      {state.error && (
        <div className="flex items-center gap-2 p-3 mb-5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      {/* Success */}
      {state.success && (
        <div className="flex items-center gap-2 p-3 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-sm">
            Account created! Redirecting...
          </p>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Full name
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              placeholder="Your name"
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          {state.fieldErrors?.name && (
            <p className="text-red-400 text-xs mt-1">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          {state.fieldErrors?.email && (
            <p className="text-red-400 text-xs mt-1">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          {state.fieldErrors?.password ? (
            <p className="text-red-400 text-xs mt-1">
              {state.fieldErrors.password[0]}
            </p>
          ) : (
            <p className="text-slate-600 text-xs mt-1">
              At least 8 characters, 1 uppercase letter, 1 number
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}