"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { signInAction, type ActionResult } from "@/actions/auth";

const initialState: ActionResult = { success: false };

export default function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

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
        <h1 className="text-xl font-semibold text-white">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-2 p-3 mb-5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
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
            <p className="text-red-400 text-xs mt-1">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          {state.fieldErrors?.password && (
            <p className="text-red-400 text-xs mt-1">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" />Signing in...</>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}