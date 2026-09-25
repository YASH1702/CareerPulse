import { Suspense } from "react";
import type { Metadata } from "next";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Sign In | CareerPulse" };

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="glass-card p-8 text-slate-500 text-center text-sm">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}