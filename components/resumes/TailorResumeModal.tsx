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
  AlertTriangle,
  TrendingUp,
  Search,
  Eye,
  Edit3,
  ShieldCheck,
  Target,
  Columns,
  FileDiff
} from "lucide-react";
import {
  tailorResumeAction,
  saveTailoredResumeAction,
  analyzeJobForTailoringAction,
  getActiveResumeDataAction,
  updateMasterResumeAndProfileAction,
  JdAnalysisData
} from "@/actions/tailor";
import type { ResumeData } from "@/types/resume";
import Link from "next/link";
import { ReplicaResumeSheet } from "./ReplicaResumeSheet";

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
  const [isMasterSaving, setIsMasterSaving] = useState(false);
  const [masterSavedSuccess, setMasterSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected skills / focus areas to emphasize
  const [selectedFocusSkills, setSelectedFocusSkills] = useState<string[]>([]);
  const [customFocusInput, setCustomFocusInput] = useState("");

  // Tailored Resume State (Editable)
  const [originalData, setOriginalData] = useState<ResumeData | null>(null);
  const [tailoredData, setTailoredData] = useState<ResumeData | null>(null);
  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [previewMode, setPreviewMode] = useState<"split" | "diff" | "tailored">("split");

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
    setMasterSavedSuccess(false);
    setActiveTab("analysis");
    setPreviewMode("split");
    setSelectedFocusSkills([...requiredSkills]);
    if (onOpenCallback) onOpenCallback();

    setIsAnalyzing(true);
    const [activeRes, analysisRes] = await Promise.all([
      getActiveResumeDataAction(),
      analyzeJobForTailoringAction(jobId),
    ]);
    setIsAnalyzing(false);

    if (activeRes.success && activeRes.resumeData) {
      setOriginalData(activeRes.resumeData);
      setTailoredData(activeRes.resumeData);
    }
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

  // 2. Save Edited Tailored Resume to Database (Linked to this Job Application)
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

  // 3. Save directly to Master Resume & Profile (Global across account)
  const handleUpdateMasterResume = async () => {
    if (!tailoredData) return;
    setIsMasterSaving(true);
    setError(null);

    const res = await updateMasterResumeAndProfileAction(tailoredData);
    setIsMasterSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to update master resume");
    } else {
      setMasterSavedSuccess(true);
      setTimeout(() => setMasterSavedSuccess(false), 4000);
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
        className={`relative w-full ${
          activeTab === "preview" && previewMode === "split" ? "max-w-7xl" : "max-w-4xl"
        } max-h-[92vh] flex flex-col rounded-2xl border border-slate-700 bg-[#0c1322] text-slate-100 shadow-2xl overflow-hidden transition-all duration-300`}
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

          {/* TAB 3: LIVE ATS DOCUMENT PREVIEW & SIDE-BY-SIDE COMPARISON */}
          {activeTab === "preview" && tailoredData && (
            <div className="space-y-5">
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    Dual-Resume Inspection · Compare Original Baseline vs. Role-Tailored Version
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-[#090e1a] p-0.5 rounded-lg border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("split")}
                      className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewMode === "split"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Show both resumes side-by-side"
                    >
                      <Columns size={13} />
                      <span>Side-by-Side</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode("diff")}
                      className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewMode === "diff"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Inspect line-by-line additions and issue checklist"
                    >
                      <FileDiff size={13} />
                      <span>Changes &amp; Issues</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode("tailored")}
                      className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewMode === "tailored"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="View single tailored resume sheet"
                    >
                      <Eye size={13} />
                      <span>Tailored Only</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("editor")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Back to Editor</span>
                  </button>
                </div>
              </div>

              {/* Extra Points Added & Quality Health Check Banner */}
              {(() => {
                const originalSkillsList: string[] = ((originalData?.skills as any)?.technical || []);
                const originalSkillsSet = new Set(originalSkillsList.map((s) => s.toLowerCase().trim()));
                const tailoredSkillsList: string[] = ((tailoredData?.skills as any)?.technical || []);
                const addedSkills = tailoredSkillsList.filter(
                  (s) => !originalSkillsSet.has(s.toLowerCase().trim())
                );
                const isSummaryChanged = Boolean(
                  originalData?.summary &&
                  tailoredData?.summary &&
                  originalData.summary.trim() !== tailoredData.summary.trim()
                );
                const missingCriticalSkills = (jdAnalysis?.missingSkills || []).filter(
                  (s) => !tailoredSkillsList.some((ts) => ts.toLowerCase().trim() === s.toLowerCase().trim())
                );

                return (
                  <>
                    <div className="p-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/30 border border-slate-700 rounded-xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Resume Customization Summary for {jobTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">Match Score:</span>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {jdAnalysis?.potentialAtsScore || 95}% ATS Fit
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Added Points / Skills */}
                        <div className="p-3 bg-black/40 border border-slate-800 rounded-lg space-y-1.5">
                          <p className="font-bold text-slate-200 flex items-center gap-1">
                            <Sparkles size={13} className="text-emerald-400" />
                            <span>Extra Targeted Skills ({addedSkills.length})</span>
                          </p>
                          {addedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {addedSkills.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                                >
                                  + {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-[11px]">
                              Using all 31 authentic skills from your baseline master.
                            </p>
                          )}
                        </div>

                        {/* Summary Status */}
                        <div className="p-3 bg-black/40 border border-slate-800 rounded-lg space-y-1.5">
                          <p className="font-bold text-slate-200 flex items-center gap-1">
                            <FileText size={13} className="text-blue-400" />
                            <span>Summary Alignment</span>
                          </p>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {isSummaryChanged
                              ? `Refocused to spotlight ${selectedFocusSkills.slice(0, 3).join(", ") || "core technologies"} for ${companyName}.`
                              : "Preserves your authentic master summary."}
                          </p>
                        </div>

                        {/* Overall Issues & Safety Checks */}
                        <div className="p-3 bg-black/40 border border-slate-800 rounded-lg space-y-1.5">
                          <p className="font-bold text-slate-200 flex items-center gap-1">
                            <ShieldCheck size={13} className="text-purple-400" />
                            <span>ATS &amp; Quality Check</span>
                          </p>
                          <ul className="space-y-1 text-[11px] text-slate-300">
                            <li className="flex items-center gap-1 text-emerald-400">
                              <Check size={12} />
                              <span>Exact Canva / Calibri visual fidelity</span>
                            </li>
                            <li className="flex items-center gap-1 text-emerald-400">
                              <Check size={12} />
                              <span>0 fake companies or hallucinated history</span>
                            </li>
                            {missingCriticalSkills.length > 0 ? (
                              <li className="flex items-center gap-1 text-amber-400">
                                <AlertTriangle size={12} />
                                <span>Optional JD skills: {missingCriticalSkills.slice(0, 2).join(", ")}</span>
                              </li>
                            ) : (
                              <li className="flex items-center gap-1 text-emerald-400">
                                <Check size={12} />
                                <span>All high-priority JD keywords covered</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* MODE 1: SPLIT SIDE-BY-SIDE VIEW (SHOWS BOTH RESUMES) */}
                    {previewMode === "split" && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* LEFT: ORIGINAL UNEDITED BASELINE RESUME */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-700/80 rounded-t-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                              <span className="text-xs font-bold text-slate-200">
                                1. Original Uploaded Resume (Default)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Baseline yashk.pdf · Unedited
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-b-xl border-x border-b border-slate-700 bg-white/5 p-1 sm:p-2">
                            <ReplicaResumeSheet
                              summary={originalData?.summary}
                              skills={originalData?.skills}
                              experience={originalData?.experience}
                              projects={originalData?.projects}
                              education={originalData?.education}
                              certifications={originalData?.certifications}
                              badgeLabel="📄 Original Baseline (Default yashk.pdf)"
                              badgeVariant="default"
                            />
                          </div>
                        </div>

                        {/* RIGHT: TAILORED RESUME FOR SPECIFIC JOB OPENING */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 bg-blue-950/60 border border-blue-600/50 rounded-t-xl shadow-lg shadow-blue-950/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              <span className="text-xs font-bold text-blue-200">
                                2. Tailored for {jobTitle}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
                              {addedSkills.length > 0 ? `+${addedSkills.length} Added Skills Highlighted` : "Optimized for Job"}
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-b-xl border-x border-b border-blue-600/40 bg-white/5 p-1 sm:p-2 ring-1 ring-blue-500/20">
                            <ReplicaResumeSheet
                              summary={tailoredData.summary}
                              skills={tailoredData.skills}
                              experience={tailoredData.experience}
                              projects={tailoredData.projects}
                              education={tailoredData.education}
                              certifications={tailoredData.certifications}
                              highlightSkills={addedSkills}
                              badgeLabel={`✨ Tailored for ${jobTitle} at ${companyName}`}
                              badgeVariant="emerald"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: LINE-BY-LINE CHANGES & ISSUES INSPECTOR */}
                    {previewMode === "diff" && (
                      <div className="space-y-4">
                        {/* Summary Diff Card */}
                        <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-blue-400" />
                            <span>Professional Summary Comparison</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-black/40 border border-slate-800 rounded-lg space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Original Baseline</span>
                              <p className="text-slate-300 leading-relaxed">{originalData?.summary || "No summary set."}</p>
                            </div>
                            <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-lg space-y-1">
                              <span className="text-[10px] uppercase font-bold text-blue-300">Tailored for {jobTitle}</span>
                              <p className="text-white leading-relaxed">{tailoredData.summary}</p>
                            </div>
                          </div>
                        </div>

                        {/* Skills Diff Card */}
                        <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-400" />
                            <span>Technical Skills Additions &amp; Alignment</span>
                          </h5>
                          <div className="space-y-2 text-xs">
                            {addedSkills.length > 0 ? (
                              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg space-y-1.5">
                                <p className="text-emerald-300 font-bold text-xs">
                                  ✨ Added / Emphasized Skills for {companyName}:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {addedSkills.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold text-xs"
                                    >
                                      + {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs">
                                All skills in the tailored version are sourced from your original master resume.
                              </p>
                            )}

                            <div className="p-3 bg-black/40 border border-slate-800 rounded-lg">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Full Tailored Technical Skills List
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {tailoredSkillsList.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Experience & Projects Verification */}
                        <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} className="text-purple-400" />
                            <span>Integrity &amp; Experience Verification</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-black/40 border border-slate-800 rounded-lg">
                              <strong className="text-white block mb-1">Work History Preserved:</strong>
                              <ul className="space-y-1 text-slate-300 text-[11px]">
                                <li>• GYMYAK Pvt. Ltd. (June 2024 – Aug 25)</li>
                                <li>• Grras Solutions Pvt. Ltd. (Jan 2022 – Jun 22)</li>
                              </ul>
                            </div>

                            <div className="p-3 bg-black/40 border border-slate-800 rounded-lg">
                              <strong className="text-white block mb-1">Authentic Academic Record:</strong>
                              <ul className="space-y-1 text-slate-300 text-[11px]">
                                <li>• KSV University — M.Sc IT (8.0 CGPA)</li>
                                <li>• JECRC University — BCA (8.20 CGPA)</li>
                                <li>• Senior Secondary (84.33%) &amp; Secondary (85%)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: SINGLE TAILORED SHEET ONLY */}
                    {previewMode === "tailored" && (
                      <div className="flex justify-center">
                        <ReplicaResumeSheet
                          summary={tailoredData.summary}
                          skills={tailoredData.skills}
                          experience={tailoredData.experience}
                          projects={tailoredData.projects}
                          education={tailoredData.education}
                          certifications={tailoredData.certifications}
                          highlightSkills={addedSkills}
                          badgeLabel={`✨ Tailored for ${jobTitle} at ${companyName}`}
                          badgeVariant="emerald"
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0f172a] shrink-0 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {savedResumeId ? (
              <Link
                href={`/resumes/${savedResumeId}`}
                target="_blank"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} />
                <span>Download / Print ATS PDF</span>
              </Link>
            ) : tailoredData && (
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all flex items-center gap-1.5"
              >
                <Eye size={13} />
                <span>Preview ATS Sheet</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs transition-all cursor-pointer"
            >
              Close
            </button>

            {tailoredData && (
              <button
                type="button"
                onClick={handleSaveTailoredResume}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                title="Saves all extra skills, summary, and bullet points directly into your custom uploaded resume and links it to this application"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving to Resume...</span>
                  </>
                ) : savedResumeId ? (
                  <>
                    <Check size={14} />
                    <span>✅ Saved to Your Custom Resume &amp; Set for this Job!</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>💾 Save Extra Details into My Resume</span>
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