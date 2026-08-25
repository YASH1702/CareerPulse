"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Linkedin, X, Loader2, CheckCircle2, AlertCircle, ArrowRight, FileText } from "lucide-react";
import { importLinkedInProfileAction } from "@/actions/linkedin-import";

export function LinkedInImportModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim() && !rawText.trim()) {
      setError("Please provide your LinkedIn profile URL or paste your profile bio/text.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await importLinkedInProfileAction({
      linkedinUrl: linkedinUrl.trim(),
      rawText: rawText.trim(),
    });

    setIsLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setLinkedinUrl("");
        setRawText("");
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || "Failed to parse LinkedIn profile.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 border border-blue-400/30 transition-all cursor-pointer"
      >
        <Linkedin size={14} className="fill-white" />
        <span>Import from LinkedIn</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-blue-500/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Linkedin size={18} className="fill-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Import LinkedIn Profile</h3>
                  <p className="text-xs text-slate-400">Auto-fill your headline, skills, education &amp; experience with AI.</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-semibold text-emerald-300 text-sm">Profile Successfully Synced!</h4>
                <p className="text-xs text-slate-400">Your skills, headline, roles, and education have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleImport} className="space-y-4">
                {/* LinkedIn URL Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>LinkedIn Profile URL</span>
                    <span className="text-[10px] text-slate-500">Public URL</span>
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Or Paste Bio / About Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Or Paste Profile Text / "About" / Experience</span>
                    <span className="text-[10px] text-slate-500">Copy-pasted from LinkedIn</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your LinkedIn About section, headline, skills, or experience bullets here..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>{isLoading ? "Extracting Profile with AI..." : "Sync Profile Now"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
