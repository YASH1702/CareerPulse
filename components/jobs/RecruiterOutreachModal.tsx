"use client";

import { useState } from "react";
import { Send, Copy, Check, X, Loader2, Sparkles, UserCheck, Mail } from "lucide-react";
import { getRecruiterOutreachAction } from "@/actions/intelligence";
import type { RecruiterOutreachPackage } from "@/lib/ai/recruiter-outreach";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export function RecruiterOutreachModal({ jobId, jobTitle, companyName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RecruiterOutreachPackage | null>(null);
  const [targetType, setTargetType] = useState<"ENGINEERING_MANAGER" | "TECHNICAL_RECRUITER">("ENGINEERING_MANAGER");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchOutreach = async (type = targetType) => {
    setIsLoading(true);
    const res = await getRecruiterOutreachAction(jobId, type);
    setIsLoading(false);
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!data) {
      fetchOutreach();
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-2.5 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
      >
        <Send size={12} />
        <span>Recruiter DM</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/20 shadow-2xl bg-[#0d1527]">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  Hiring Team Cold Outreach Generator
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Targeted high-converting messages for <strong className="text-slate-200">{jobTitle}</strong> at <strong className="text-slate-200">{companyName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient Selector Tabs */}
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between gap-3 bg-white/[0.01]">
              <span className="text-xs text-slate-400">Target Recipient:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setTargetType("ENGINEERING_MANAGER"); fetchOutreach("ENGINEERING_MANAGER"); }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    targetType === "ENGINEERING_MANAGER"
                      ? "bg-purple-600 text-white border-purple-500 font-medium"
                      : "bg-white/[0.02] text-slate-400 border-white/[0.05] hover:text-white"
                  }`}
                >
                  Engineering Manager
                </button>
                <button
                  onClick={() => { setTargetType("TECHNICAL_RECRUITER"); fetchOutreach("TECHNICAL_RECRUITER"); }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    targetType === "TECHNICAL_RECRUITER"
                      ? "bg-purple-600 text-white border-purple-500 font-medium"
                      : "bg-white/[0.02] text-slate-400 border-white/[0.05] hover:text-white"
                  }`}
                >
                  Technical Recruiter
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 size={24} className="animate-spin text-purple-400 mx-auto" />
                  <p className="text-xs text-slate-400">Crafting personalized outreach note...</p>
                </div>
              ) : data ? (
                <div className="space-y-4">
                  {/* LinkedIn Connection Note */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <UserCheck size={14} className="text-blue-400" />
                        <span>LinkedIn Connection Request Note</span>
                        <span className="text-[10px] text-slate-500 font-normal">(&lt;300 chars limit)</span>
                      </label>
                      <button
                        onClick={() => copyToClipboard(data.linkedInConnectionNote, "linkedin")}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        {copiedKey === "linkedin" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedKey === "linkedin" ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-200 leading-relaxed font-mono">
                      {data.linkedInConnectionNote}
                    </div>
                  </div>

                  {/* Cold Email */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Mail size={14} className="text-indigo-400" />
                        <span>Cold Email / InMail Message</span>
                      </label>
                      <button
                        onClick={() => copyToClipboard(`Subject: ${data.coldEmailSubject}\n\n${data.coldEmailBody}`, "email")}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        {copiedKey === "email" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedKey === "email" ? "Copied!" : "Copy Full Email"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-2 text-xs text-slate-200">
                      <p className="text-slate-400 text-[11px]">
                        <strong>Subject:</strong> {data.coldEmailSubject}
                      </p>
                      <hr className="border-white/[0.05]" />
                      <p className="whitespace-pre-wrap leading-relaxed">{data.coldEmailBody}</p>
                    </div>
                  </div>

                  {/* Suggested Follow Up */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Suggested 5-Day Follow-Up Message:
                    </label>
                    <p className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] italic">
                      "{data.suggestedFollowUp}"
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <span className="text-[11px] text-slate-500">
                Tip: Direct messages to managers have a 4.2x higher reply rate than blind applications.
              </span>
              <button onClick={() => setIsOpen(false)} className="btn-ghost text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}