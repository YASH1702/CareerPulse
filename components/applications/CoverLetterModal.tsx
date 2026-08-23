"use client";

import { useState } from "react";
import { Sparkles, X, Copy, Check, Loader2, Save, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { generateCoverLetterAction } from "@/actions/applications";
import type { CoverLetterTone } from "@/lib/ai/prompts/cover-letter";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  initialCoverLetter?: string | null;
  onClose: () => void;
  onSaved?: (text: string) => void;
}

export function CoverLetterModal({
  jobId,
  jobTitle,
  companyName,
  initialCoverLetter,
  onClose,
  onSaved,
}: Props) {
  const [tone, setTone] = useState<CoverLetterTone>("PROFESSIONAL");
  const [notes, setNotes] = useState("");
  const [coverLetterText, setCoverLetterText] = useState<string>(initialCoverLetter || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const res = await generateCoverLetterAction({
      jobId,
      tone,
      customNotes: notes,
    });
    setIsGenerating(false);

    if (!res.success || !res.coverLetterText) {
      setError(res.error || "Failed to generate cover letter.");
    } else {
      setCoverLetterText(res.coverLetterText);
    }
  };

  const handleCopy = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSuccess(true);
    if (onSaved) onSaved(coverLetterText);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#0d1527]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              Cover Letter Generator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized for {jobTitle} at {companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
              <CheckCircle2 size={15} />
              <span>Cover letter saved to application package!</span>
            </div>
          )}

          {/* Tone & Options Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
            <div>
              <label className="label-field text-xs">Writing Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                className="input-field py-1.5 text-xs"
              >
                <option value="PROFESSIONAL">Professional & Technical Impact</option>
                <option value="STARTUP">High-Agency / Fast-Paced Startup</option>
                <option value="ENTHUSIASTIC">Passionate & Mission-Driven</option>
                <option value="EXECUTIVE">Technical Leadership & Strategy</option>
              </select>
            </div>

            <div>
              <label className="label-field text-xs">Custom Note / Angle (Optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. emphasize Next.js App Router or GraphQL"
                className="input-field py-1.5 text-xs"
              />
            </div>
          </div>

          {!coverLetterText ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate a clean, high-conversion cover letter highlighting your genuine engineering achievements relevant to this role.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary text-xs mx-auto flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Generating Letter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Generate Cover Letter</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Editable Content:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-ghost text-xs flex items-center gap-1.5"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="btn-ghost text-xs flex items-center gap-1.5"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Save size={12} />
                    <span>Save to Package</span>
                  </button>
                </div>
              </div>

              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                rows={12}
                className="input-field text-xs leading-relaxed font-sans"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}