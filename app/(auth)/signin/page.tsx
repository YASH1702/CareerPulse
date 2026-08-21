import { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <div className="glass-card p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            JP
          </div>
          <span className="font-semibold text-lg">JobPilot AI</span>
        </div>
        <p className="text-slate-400 text-sm">Find the right jobs. Apply smarter.</p>
      </div>
      {/* Auth form will be built in Phase 2 */}
      <p className="text-center text-slate-500 text-sm">Auth coming in Phase 2</p>
    </div>
  );
}
