"use client";

import { useState } from "react";
import { Sparkles, FileText, Check, Plus, Trash2, Loader2, X, Download, Printer, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { tailorResumeAction, saveTailoredResumeAction } from "@/actions/tailor";
import type { ResumeData } from "@/types/resume";
import Link from "next/link";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export function TailorResumeModal({
  jobId,
  jobTitle,
  companyName,
  requiredSkills = [],
  preferredSkills = [],
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected skills / focus areas to emphasize
  const [selectedFocusSkills, setSelectedFocusSkills] = useState<string[]>([]);
  const [customFocusInput, setCustomFocusInput] = useState("");

  // Tailored Resume State (Editable)
  const [tailoredData, setTailoredData] = useState<ResumeData | null>(null);
  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState("");

  // All JD skills
  const allJdSkills = Array.from(new Set([...requiredSkills, ...preferredSkills]));

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
    setSavedResumeId(null);
    // Pre-select all required skills as default focus areas
    setSelectedFocusSkills([...requiredSkills]);
  };

  const toggleFocusSkill = (skill: string) => {
    setSelectedFocusSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFocusInput.trim()) return;
    const skill = customFocusInput.trim();
    if (!selectedFocusSkills.includes(skill)) {
      setSelectedFocusSkills((prev) => [...prev, skill]);
    }
    setCustomFocusInput("");
  };

  // 1. Generate Tailored Resume via AI
  const handleGenerateTailoring = async () => {
    setIsGenerating(true);
    setError(null);

    const res = await tailorResumeAction(jobId, selectedFocusSkills);
    setIsGenerating(false);

    if (!res.success || !res.tailoredResume) {
      setError(res.error || "Failed to tailor resume");
    } else {
      setTailoredData(res.tailoredResume);
    }
  };

  // 2. Save Edited Tailored Resume to Database
  const handleSaveTailoredResume = async () => {
    if (!tailoredData) return;
    setIsSaving(true);
    setError(null);

    const res = await saveTailoredResumeAction(
      jobId,
      tailoredData,
      `Tailored: ${jobTitle} at ${companyName}`
    );
    setIsSaving(false);

    if (!res.success || !res.resumeId) {
      setError(res.error || "Failed to save tailored resume");
    } else {
      setSavedResumeId(res.resumeId);
    }
  };

  // Live Editor Handlers
  const handleSummaryChange = (summary: string) => {
    if (!tailoredData) return;
    setTailoredData({ ...tailoredData, summary });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillInput.trim() || !tailoredData) return;
    const skill = customSkillInput.trim();
    const existing = tailoredData.skills?.technical || [];
    if (!existing.includes(skill)) {
      setTailoredData({
        ...tailoredData,
        skills: {
          ...tailoredData.skills,
          technical: [skill, ...existing],
        },
      });
    }
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!tailoredData) return;
    setTailoredData({
      ...tailoredData,
      skills: {
        ...tailoredData.skills,
        technical: (tailoredData.skills?.technical || []).filter((s) => s !== skillToRemove),
      },
    });
  };

  const handleUpdateExperienceBullet = (expIdx: number, bulletIdx: number, text: string) => {
    if (!tailoredData || !tailoredData.experience) return;
    const newExp = [...tailoredData.experience];
    const newBullets = [...(newExp[expIdx].bullets || [])];
    newBullets[bulletIdx] = text;
    newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
    setTailoredData({ ...tailoredData, experience: newExp });
  };

  const handleUpdateProjectBullet = (projIdx: number, bulletIdx: number, text: string) => {
    if (!tailoredData || !tailoredData.projects) return;
    const newProj = [...tailoredData.projects];
    const newBullets = [...(newProj[projIdx].bullets || [])];
    newBullets[bulletIdx] = text;
    newProj[projIdx] = { ...newProj[projIdx], bullets: newBullets };
    setTailoredData({ ...tailoredData, projects: newProj });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 hover:border-blue-500/40 hover:text-blue-300 transition-all"
        title="Tailor and customize resume specifically for this job"
      >
        <Sparkles size={13} className="text-blue-400" />
        <span>Tailor Resume</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-blue-500/30 shadow-2xl bg-[#090e1a]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    Tailor & Edit Resume for {jobTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Target: <strong className="text-slate-200">{companyName}</strong> · Align keywords & bullets with the job description
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {error && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Target Skills Selection & Focus Customization */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span>Select Skills to Emphasize for this Job Description</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {selectedFocusSkills.length} selected
                  </span>
                </div>

                <p className="text-slate-400 text-[11px]">
                  Click skills to prioritize in your tailored resume, or add specific technologies you know that match this job posting:
                </p>

                {allJdSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allJdSkills.map((skill) => {
                      const isSelected = selectedFocusSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleFocusSkill(skill)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 border ${
                            isSelected
                              ? "bg-blue-600/30 border-blue-500/60 text-blue-200 shadow-sm"
                              : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{skill}</span>
                          {isSelected && <Check size={11} className="text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Skill / Focus Area Input */}
                <form onSubmit={handleAddCustomFocus} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customFocusInput}
                    onChange={(e) => setCustomFocusInput(e.target.value)}
                    placeholder="Add other skills or strengths to emphasize (e.g., PostgreSQL, Docker, Next.js, Microservices)..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add Skill</span>
                  </button>
                </form>

                {/* Generate Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateTailoring}
                    disabled={isGenerating}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>AI Tailoring Bullets &amp; Summary...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>⚡ Generate &amp; Optimize Resume for This Job</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Interactive Resume Editor */}
              {tailoredData && (
                <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-purple-400" />
                      <span>Live Resume Editor (Customized for {companyName})</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check size={13} /> Tailored to JD
                    </span>
                  </div>

                  {/* 1. Tailored Professional Summary */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Target Professional Summary
                    </label>
                    <textarea
                      value={tailoredData.summary || ""}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none leading-relaxed"
                      placeholder="Professional summary tailored for this position..."
                    />
                  </div>

                  {/* 2. Technical Skills List */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Technical Skills (Prioritized for ATS Keywords)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-black/30 border border-white/10 rounded-xl min-h-[50px]">
                      {(tailoredData.skills?.technical || []).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-200 rounded-md text-xs font-medium flex items-center gap-1.5"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddSkill} className="flex gap-2">
                      <input
                        type="text"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        placeholder="Type a skill and press enter..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>

                  {/* 3. Tailored Experience Bullets */}
                  {tailoredData.experience && tailoredData.experience.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Experience Achievements &amp; Tech Stack Bullets
                      </label>
                      <div className="space-y-3">
                        {tailoredData.experience.map((exp, expIdx) => (
                          <div key={expIdx} className="p-3.5 bg-black/30 border border-white/10 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-slate-300 font-semibold">
                              <span>{exp.role} · <strong className="text-white">{exp.company}</strong></span>
                              <span className="text-slate-500 text-[11px]">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                            </div>
                            <div className="space-y-1.5">
                              {(exp.bullets || []).map((bullet, bulletIdx) => (
                                <textarea
                                  key={bulletIdx}
                                  value={bullet}
                                  onChange={(e) => handleUpdateExperienceBullet(expIdx, bulletIdx, e.target.value)}
                                  rows={2}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Tailored Project Bullets */}
                  {tailoredData.projects && tailoredData.projects.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Project Descriptions &amp; Architecture
                      </label>
                      <div className="space-y-3">
                        {tailoredData.projects.map((proj, projIdx) => (
                          <div key={projIdx} className="p-3.5 bg-black/30 border border-white/10 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-slate-300 font-semibold">
                              <span className="text-white font-bold">{proj.name}</span>
                              <span className="text-blue-400 text-[11px]">{(proj.technologies || []).join(", ")}</span>
                            </div>
                            <div className="space-y-1.5">
                              {(proj.bullets || [proj.description]).map((bullet, bulletIdx) => (
                                <textarea
                                  key={bulletIdx}
                                  value={bullet || ""}
                                  onChange={(e) => handleUpdateProjectBullet(projIdx, bulletIdx, e.target.value)}
                                  rows={2}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {savedResumeId && (
                  <Link
                    href={`/resumes/${savedResumeId}`}
                    target="_blank"
                    className="btn-secondary text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                  >
                    <Printer size={13} />
                    <span>Preview &amp; Save ATS PDF</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-ghost text-xs px-3 py-2"
                >
                  Close
                </button>

                {tailoredData && (
                  <button
                    type="button"
                    onClick={handleSaveTailoredResume}
                    disabled={isSaving}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving Resume...</span>
                      </>
                    ) : savedResumeId ? (
                      <>
                        <Check size={14} />
                        <span>✅ Saved &amp; Set for this Job!</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>💾 Save Tailored Resume &amp; Set for this Job</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}