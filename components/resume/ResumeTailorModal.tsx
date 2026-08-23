"use client";

import { useState } from "react";
import { Sparkles, X, Check, ArrowRight, Loader2, Save, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { tailorResumeAction, saveTailoredResumeAction } from "@/actions/tailor";
import type { ResumeData } from "@/types/resume";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onSaved?: (resumeId: string) => void;
}

export function ResumeTailorModal({ jobId, jobTitle, companyName, onClose, onSaved }: Props) {
  const [isTailoring, setIsTailoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setIsTailoring(true);
    setError(null);

    const res = await tailorResumeAction(jobId);
    setIsTailoring(false);

    if (!res.success || !res.tailoredResume) {
      setError(res.error || "Failed to tailor resume.");
    } else {
      setTailoredResume(res.tailoredResume);
    }
  };

  const handleSave = async () => {
    if (!tailoredResume) return;

    setIsSaving(true);
    setError(null);

    const res = await saveTailoredResumeAction(jobId, tailoredResume);
    setIsSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to save tailored resume.");
    } else {
      setSuccess(true);
      if (onSaved && res.resumeId) onSaved(res.resumeId);
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#0d1527]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              Tailor Resume for {jobTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customizes your verified master resume bullets & summary to match {companyName}&apos;s requirements with strict factual accuracy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
              <CheckCircle2 size={15} />
              <span>Tailored resume saved and linked to your application package!</span>
            </div>
          )}

          {!tailoredResume ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                <FileText size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-semibold text-white">Generate Targeted Resume</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  AI will analyze the job posting and reorganize your existing experiences, highlight matching technical keywords, and polish your bullet points for ATS systems without inventing any false claims.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isTailoring}
                className="btn-primary text-xs mx-auto flex items-center gap-2"
              >
                {isTailoring ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Tailoring Resume (takes ~10s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Start Resume Tailoring</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions Header */}
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Tailored version ready for review
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isTailoring}
                    className="btn-ghost text-xs flex items-center gap-1.5"
                  >
                    {isTailoring ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    <span>Save to Application</span>
                  </button>
                </div>
              </div>

              {/* Summary Section */}
              {tailoredResume.summary && (
                <div className="space-y-2">
                  <label className="label-field text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    Tailored Professional Summary
                  </label>
                  <textarea
                    value={tailoredResume.summary}
                    onChange={(e) => setTailoredResume({ ...tailoredResume, summary: e.target.value })}
                    rows={3}
                    className="input-field text-xs leading-relaxed"
                  />
                </div>
              )}

              {/* Highlighted Skills */}
              {tailoredResume.skills?.technical && tailoredResume.skills.technical.length > 0 && (
                <div className="space-y-2">
                  <label className="label-field text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    Prioritized Technical Skills
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredResume.skills.technical.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tailored Experience */}
              {tailoredResume.experience && tailoredResume.experience.length > 0 && (
                <div className="space-y-3">
                  <label className="label-field text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    Tailored Experience Bullets
                  </label>
                  <div className="space-y-3">
                    {tailoredResume.experience.map((exp, expIdx) => (
                      <div key={expIdx} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
                        <div className="flex justify-between items-baseline">
                          <p className="font-semibold text-white text-xs">{exp.role} · <span className="text-slate-400">{exp.company}</span></p>
                          <span className="text-[11px] text-slate-500">{exp.startDate} – {exp.endDate || "Present"}</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="text-blue-400 font-bold mt-0.5">•</span>
                              <input
                                value={b}
                                onChange={(e) => {
                                  const updatedExp = [...tailoredResume.experience];
                                  updatedExp[expIdx].bullets[bIdx] = e.target.value;
                                  setTailoredResume({ ...tailoredResume, experience: updatedExp });
                                }}
                                className="input-field py-1 text-xs flex-1"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}