"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  FileText,
  Check,
  Plus,
  Trash2,
  Loader2,
  X,
  Printer,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Eye,
  Edit3,
  ShieldCheck,
  Target
} from "lucide-react";
import {
  tailorResumeAction,
  saveTailoredResumeAction,
  analyzeJobForTailoringAction,
  JdAnalysisData
} from "@/actions/tailor";
import type { ResumeData } from "@/types/resume";
import Link from "next/link";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  onOpenCallback?: () => void;
}

type ActiveTab = "analysis" | "editor" | "preview";

export function TailorResumeModal({
  jobId,
  jobTitle,
  companyName,
  requiredSkills = [],
  preferredSkills = [],
  onOpenCallback,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("analysis");

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState<JdAnalysisData | null>(null);

  // Tailoring & Generating State
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // All JD skills
  const allJdSkills = Array.from(new Set([...requiredSkills, ...preferredSkills]));

  const handleOpen = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(true);
    setError(null);
    setSavedResumeId(null);
    setActiveTab("analysis");
    setSelectedFocusSkills([...requiredSkills]);
    if (onOpenCallback) onOpenCallback();

    setIsAnalyzing(true);
    const analysisRes = await analyzeJobForTailoringAction(jobId);
    setIsAnalyzing(false);
    if (analysisRes.success && analysisRes.analysis) {
      setJdAnalysis(analysisRes.analysis);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const toggleFocusSkill = (skill: string) => {
    setSelectedFocusSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomFocus = (skillToAdd?: string) => {
    const skill = (skillToAdd || customFocusInput).trim();
    if (!skill) return;
    if (!selectedFocusSkills.includes(skill)) {
      setSelectedFocusSkills((prev) => [...prev, skill]);
    }
    if (!skillToAdd) setCustomFocusInput("");
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
      setActiveTab("editor");
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

  const modalContent = isOpen && (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-[#0c1322] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                <span>Tailor &amp; Preview Resume for {jobTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {companyName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detailed JD analysis, strategic keyword injection &amp; real-time ATS preview
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-[#090e1a] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "analysis"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search size={14} />
            <span>1. JD Deep Analysis &amp; Suggestions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "editor"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit3 size={14} />
            <span>2. Live Resume Editor</span>
            {tailoredData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            disabled={!tailoredData}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "preview"
                ? "border-blue-500 text-blue-400"
                : tailoredData
                ? "border-transparent text-slate-400 hover:text-slate-200"
                : "border-transparent text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            <Eye size={14} />
            <span>3. ATS Document Preview</span>
            {tailoredData && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                Ready
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-[#0c1322]">
          {error && (
            <div className="p-3.5 bg-red-900/30 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: DEEP JD ANALYSIS & SUGGESTIONS */}
          {activeTab === "analysis" && (
            <div className="space-y-5">
              {/* Score & Potential Card */}
              <div className="p-5 bg-gradient-to-r from-blue-900/30 via-[#121a2d] to-indigo-900/20 border border-slate-700 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <Target size={14} /> ATS Keyword Match Score
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {jdAnalysis?.roleSummary || `Targeting ${jobTitle} at ${companyName}`}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Calculated by analyzing technical requirements, frameworks, and architecture expectations.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center px-4 py-2 bg-black/40 border border-slate-700 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Match</p>
                    <p className="text-xl font-bold text-amber-400">{jdAnalysis?.currentAtsScore || 72}%</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-500" />
                  <div className="text-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-[10px] text-emerald-300 uppercase font-semibold">Potential Match</p>
                    <p className="text-xl font-bold text-emerald-400">{jdAnalysis?.potentialAtsScore || 94}%</p>
                  </div>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span>Strategic Job Description Recommendations</span>
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {isAnalyzing ? (
                    <div className="p-6 bg-[#121a2d] border border-slate-700 rounded-xl text-center space-y-2">
                      <Loader2 size={20} className="animate-spin text-blue-400 mx-auto" />
                      <p className="text-slate-300 font-semibold">Analyzing Job Description &amp; Generating Suggestions...</p>
                    </div>
                  ) : (
                    jdAnalysis?.suggestions.map((sug, idx) => (
                      <div key={idx} className="p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-300 text-xs">{sug.category}</span>
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                            Action Item
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{sug.advice}</p>

                        {/* Suggested Skills Pill Insertion */}
                        {sug.suggestedSkillsToAdd && sug.suggestedSkillsToAdd.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                            <span className="text-[11px] text-slate-400">Click to add:</span>
                            {sug.suggestedSkillsToAdd.map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleAddCustomFocus(skill)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all border ${
                                  selectedFocusSkills.includes(skill)
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-black/40 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                              >
                                <span>+ {skill}</span>
                                {selectedFocusSkills.includes(skill) && <Check size={11} />}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Sample High Impact Bullet Point */}
                        {sug.sampleBullet && (
                          <div className="p-3 bg-black/40 border border-slate-800 rounded-lg text-[11px] text-emerald-300 space-y-1 mt-2">
                            <strong className="text-[10px] uppercase tracking-wider text-slate-400 block">
                              Suggested Bullet for your Experience:
                            </strong>
                            <p className="italic">"{sug.sampleBullet}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Skills Selector */}
              <div className="p-5 bg-[#121a2d] border border-slate-700/80 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-blue-400" />
                    <span>Skills to Include in this Tailored Resume ({selectedFocusSkills.length} selected)</span>
                  </h4>
                </div>

                {allJdSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {allJdSkills.map((skill) => {
                      const isSelected = selectedFocusSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleFocusSkill(skill)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                              : "bg-[#18233c] border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          <span>{skill}</span>
                          {isSelected && <Check size={13} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Skill Input */}
                <form onSubmit={(e) => { e.preventDefault(); handleAddCustomFocus(); }} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customFocusInput}
                    onChange={(e) => setCustomFocusInput(e.target.value)}
                    placeholder="Add other skills or strengths (e.g., PostgreSQL, Docker, Next.js, Microservices)..."
                    className="flex-1 bg-[#090e1a] border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Action Button to Generate */}
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-white text-xs">Ready to optimize?</p>
                  <p className="text-slate-400 text-[11px]">Generate customized bullet points &amp; summary matching these requirements.</p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTailoring}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>AI Tailoring Bullets &amp; Summary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>⚡ Generate &amp; Optimize Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Interactive Resume Editor */}
          {tailoredData && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-purple-400" />
                  <span>Live Resume Editor (Customized for {companyName})</span>
                </h4>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <Check size={14} /> Tailored to JD
                </span>
              </div>

              {/* 1. Tailored Professional Summary */}
              <div className="space-y-2 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
                <label className="text-xs font-bold text-slate-200">
                  Target Professional Summary
                </label>
                <textarea
                  value={tailoredData.summary || ""}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                  rows={3}
                  className="w-full bg-[#090e1a] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                  placeholder="Professional summary tailored for this position..."
                />
              </div>

              {/* 2. Technical Skills List */}
              <div className="space-y-2.5 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
                <label className="text-xs font-bold text-slate-200">
                  Technical Skills (Prioritized for ATS Keywords)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-[#090e1a] border border-slate-700 rounded-lg min-h-[50px]">
                  {(tailoredData.skills?.technical || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-600/20 border border-blue-500/40 text-blue-200 rounded-md text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-400 transition-colors text-sm font-bold ml-1"
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
                    className="flex-1 bg-[#090e1a] border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* 3. Tailored Experience Bullets */}
              {tailoredData.experience && tailoredData.experience.length > 0 && (
                <div className="space-y-3 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
                  <label className="text-xs font-bold text-slate-200">
                    Experience Achievements &amp; Tech Stack Bullets
                  </label>
                  <div className="space-y-3">
                    {tailoredData.experience.map((exp, expIdx) => (
                      <div key={expIdx} className="p-3.5 bg-[#090e1a] border border-slate-700/80 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span>{exp.role} · <strong className="text-white">{exp.company}</strong></span>
                          <span className="text-slate-500 text-[11px]">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                        </div>
                        <div className="space-y-2">
                          {(exp.bullets || []).map((bullet, bulletIdx) => (
                            <textarea
                              key={bulletIdx}
                              value={bullet}
                              onChange={(e) => handleUpdateExperienceBullet(expIdx, bulletIdx, e.target.value)}
                              rows={2}
                              className="w-full bg-[#121a2d] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
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
                <div className="space-y-3 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
                  <label className="text-xs font-bold text-slate-200">
                    Project Descriptions &amp; Architecture
                  </label>
                  <div className="space-y-3">
                    {tailoredData.projects.map((proj, projIdx) => (
                      <div key={projIdx} className="p-3.5 bg-[#090e1a] border border-slate-700/80 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span className="text-white font-bold">{proj.name}</span>
                          <span className="text-blue-400 text-[11px]">{(proj.technologies || []).join(", ")}</span>
                        </div>
                        <div className="space-y-2">
                          {(proj.bullets || [proj.description]).map((bullet, bulletIdx) => (
                            <textarea
                              key={bulletIdx}
                              value={bullet || ""}
                              onChange={(e) => handleUpdateProjectBullet(projIdx, bulletIdx, e.target.value)}
                              rows={2}
                              className="w-full bg-[#121a2d] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
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

          {/* TAB 3: LIVE ATS DOCUMENT PREVIEW */}
          {activeTab === "preview" && tailoredData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Exact ATS Format Sheet · What recruiter scanners and hiring managers see</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("editor")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Back to Editor</span>
                </button>
              </div>

              {/* Clean White/Black ATS Document Sheet */}
              <div className="bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl space-y-6 font-serif text-[12px] leading-relaxed select-text border border-slate-300">
                {/* Header */}
                <div className="text-center border-b border-black/20 pb-4 space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-black uppercase">
                    Candidate Profile
                  </h1>
                  <p className="text-sm font-semibold text-slate-800">{jobTitle}</p>
                </div>

                {/* Professional Summary */}
                {tailoredData.summary && (
                  <div className="space-y-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                      Professional Summary
                    </h2>
                    <p className="text-slate-800 leading-relaxed">{tailoredData.summary}</p>
                  </div>
                )}

                {/* Technical Skills */}
                {tailoredData.skills?.technical && tailoredData.skills.technical.length > 0 && (
                  <div className="space-y-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                      Technical Skills
                    </h2>
                    <p className="text-slate-800 leading-relaxed">
                      <strong className="font-semibold text-black">Core Technologies: </strong>
                      {tailoredData.skills.technical.join(", ")}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {tailoredData.experience && tailoredData.experience.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                      Work Experience
                    </h2>
                    <div className="space-y-3">
                      {tailoredData.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-bold text-black">
                            <span>{exp.role} · {exp.company}</span>
                            <span className="font-normal text-slate-600 text-[11px]">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11.5px]">
                            {(exp.bullets || []).map((b, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {tailoredData.projects && tailoredData.projects.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
                      Projects &amp; Technical Architecture
                    </h2>
                    <div className="space-y-3">
                      {tailoredData.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-bold text-black">
                            <span>{proj.name}</span>
                            <span className="font-normal text-slate-600 text-[11px]">{(proj.technologies || []).join(", ")}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11.5px]">
                            {(proj.bullets || [proj.description]).map((b, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0f172a] shrink-0 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {savedResumeId && (
              <Link
                href={`/resumes/${savedResumeId}`}
                target="_blank"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} />
                <span>Preview &amp; Save ATS PDF</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs transition-all"
            >
              Close
            </button>

            {tailoredData && (
              <button
                type="button"
                onClick={handleSaveTailoredResume}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Resume...</span>
                  </>
                ) : savedResumeId ? (
                  <>
                    <Check size={15} />
                    <span>✅ Saved &amp; Set for this Job!</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>💾 Save Tailored Resume &amp; Set for this Job</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-slate-200 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        title="Tailor and customize resume specifically for this job"
      >
        <Sparkles size={13} className="text-blue-400" />
        <span>Tailor Resume</span>
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}