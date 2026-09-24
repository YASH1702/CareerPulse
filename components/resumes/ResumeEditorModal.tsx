"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Check,
  Plus,
  Trash2,
  Loader2,
  X,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { updateResumeContentAction } from "@/actions/resumes";
import type { ResumeData } from "@/types/resume";

interface Props {
  resumeId: string;
  resumeName: string;
  initialSummary?: string | null;
  initialSkills?: any;
  initialExperience?: any;
  initialProjects?: any;
  initialEducation?: any;
  initialCertifications?: any;
}

export function ResumeEditorModal({
  resumeId,
  resumeName,
  initialSummary,
  initialSkills,
  initialExperience,
  initialProjects,
  initialEducation,
  initialCertifications,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState(initialSummary || "");
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(
    initialSkills?.technical || []
  );
  const [experience, setExperience] = useState<any[]>(
    Array.isArray(initialExperience) ? initialExperience : []
  );
  const [projects, setProjects] = useState<any[]>(
    Array.isArray(initialProjects) ? initialProjects : []
  );
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
    setSavedSuccess(false);
    setSummary(initialSummary || "");
    setTechnicalSkills(initialSkills?.technical || []);
    setExperience(Array.isArray(initialExperience) ? initialExperience : []);
    setProjects(Array.isArray(initialProjects) ? initialProjects : []);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const s = skillInput.trim();
    if (!technicalSkills.includes(s)) {
      setTechnicalSkills([s, ...technicalSkills]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechnicalSkills(technicalSkills.filter((s) => s !== skillToRemove));
  };

  const handleUpdateExpBullet = (expIdx: number, bulletIdx: number, text: string) => {
    const newExp = [...experience];
    const newBullets = [...(newExp[expIdx].bullets || [])];
    newBullets[bulletIdx] = text;
    newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
    setExperience(newExp);
  };

  const handleUpdateProjBullet = (projIdx: number, bulletIdx: number, text: string) => {
    const newProj = [...projects];
    const newBullets = [...(newProj[projIdx].bullets || [])];
    newBullets[bulletIdx] = text;
    newProj[projIdx] = { ...newProj[projIdx], bullets: newBullets };
    setProjects(newProj);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const updatedData: ResumeData = {
      summary,
      skills: { technical: technicalSkills, soft: initialSkills?.soft || [] },
      experience,
      projects,
      education: initialEducation || [],
      certifications: initialCertifications || [],
      achievements: [],
    };

    const res = await updateResumeContentAction(resumeId, updatedData);
    setIsSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to save resume");
    } else {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsOpen(false);
      }, 1500);
    }
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
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shrink-0">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Edit Resume: {resumeName}
              </h3>
              <p className="text-xs text-slate-400">
                Update professional summary, technical skills, and achievements
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-[#0c1322]">
          {error && (
            <div className="p-3.5 bg-red-900/30 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Professional Summary */}
          <div className="space-y-2 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
            <label className="text-xs font-bold text-slate-200">
              Professional Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full bg-[#090e1a] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
              placeholder="Candidate professional summary..."
            />
          </div>

          {/* 2. Technical Skills */}
          <div className="space-y-2.5 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
            <label className="text-xs font-bold text-slate-200">
              Technical Skills ({technicalSkills.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-[#090e1a] border border-slate-700 rounded-lg min-h-[50px]">
              {technicalSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-600/20 border border-blue-500/40 text-blue-200 rounded-md text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-400 transition-colors text-sm font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a new skill and press enter..."
                className="flex-1 bg-[#090e1a] border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Skill</span>
              </button>
            </form>
          </div>

          {/* 3. Work Experience */}
          {experience.length > 0 && (
            <div className="space-y-3 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
              <label className="text-xs font-bold text-slate-200">
                Work Experience Bullets
              </label>
              <div className="space-y-3">
                {experience.map((exp, expIdx) => (
                  <div key={expIdx} className="p-3.5 bg-[#090e1a] border border-slate-700/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>{exp.role} · <strong className="text-white">{exp.company}</strong></span>
                      <span className="text-slate-500 text-[11px]">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                    </div>
                    <div className="space-y-2">
                      {(exp.bullets || []).map((bullet: string, bulletIdx: number) => (
                        <textarea
                          key={bulletIdx}
                          value={bullet}
                          onChange={(e) => handleUpdateExpBullet(expIdx, bulletIdx, e.target.value)}
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

          {/* 4. Projects */}
          {projects.length > 0 && (
            <div className="space-y-3 p-4 bg-[#121a2d] border border-slate-700/80 rounded-xl">
              <label className="text-xs font-bold text-slate-200">
                Projects
              </label>
              <div className="space-y-3">
                {projects.map((proj, projIdx) => (
                  <div key={projIdx} className="p-3.5 bg-[#090e1a] border border-slate-700/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span className="text-white font-bold">{proj.name}</span>
                      <span className="text-blue-400 text-[11px]">{(proj.technologies || []).join(", ")}</span>
                    </div>
                    <div className="space-y-2">
                      {(proj.bullets || [proj.description]).map((bullet: string, bulletIdx: number) => (
                        <textarea
                          key={bulletIdx}
                          value={bullet || ""}
                          onChange={(e) => handleUpdateProjBullet(projIdx, bulletIdx, e.target.value)}
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

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0f172a] shrink-0 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Resume...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={15} />
                <span>✅ Saved Successfully!</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/40 text-slate-200 hover:text-white rounded-lg transition-colors font-medium flex items-center gap-1 cursor-pointer"
        title="Edit resume details, skills, and bullet points"
      >
        <Edit3 size={13} className="text-blue-400" />
        <span>Edit</span>
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}