"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2, Star, ChevronDown, ChevronUp, Loader2, Edit2, Check, X } from "lucide-react";
import { deleteResumeAction, updateResumeNameAction } from "@/actions/resumes";
import { formatRelativeDate } from "@/utils/format";

interface ResumeCardProps {
  resume: {
    id: string;
    name: string;
    resumeType: string;
    fileName: string | null;
    fileUrl: string | null;
    wordCount: number | null;
    atsScore: number | null;
    summary: string | null;
    skills: unknown;
    experience: unknown;
    createdAt: Date;
    updatedAt: Date;
  };
  isOnly?: boolean;
}

export function ResumeCard({ resume, isOnly }: ResumeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(resume.name);

  const skills = resume.skills as { technical?: string[]; soft?: string[] } | null;
  const experience = resume.experience as Array<{ company: string; role: string; startDate: string; endDate?: string }> | null;
  const hasAIData = !!skills || !!experience;

  async function handleDelete() {
    if (!confirm(`Delete "${resume.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteResumeAction(resume.id);
  }

  async function handleSaveName() {
    if (nameVal.trim() && nameVal !== resume.name) {
      await updateResumeNameAction(resume.id, nameVal.trim());
    }
    setEditingName(false);
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <FileText size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={nameVal} onChange={(e) => setNameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="input-field py-1 text-sm" autoFocus />
                <button onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300"><Check size={14} /></button>
                <button onClick={() => setEditingName(false)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium text-white text-sm truncate">{resume.name}</p>
                <button onClick={() => setEditingName(true)} className="text-slate-600 hover:text-slate-400 shrink-0">
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {resume.fileName && <span className="text-slate-500 text-xs truncate">{resume.fileName}</span>}
              {resume.wordCount && <span className="text-slate-600 text-xs">{resume.wordCount} words</span>}
              <span className="text-slate-700 text-xs">{formatRelativeDate(resume.updatedAt)}</span>
              {hasAIData && (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                  AI extracted
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/resumes/${resume.id}`}
            className="px-2.5 py-1.5 text-xs bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors font-medium"
          >
            ATS Print
          </Link>
          {resume.fileUrl && (
            <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer"
              className="px-2.5 py-1.5 text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-slate-400 hover:text-white rounded-lg transition-colors">
              File
            </a>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {!isOnly && (
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50">
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && hasAIData && (
        <div className="border-t border-white/[0.05] p-5 space-y-5">
          {/* Summary */}
          {resume.summary && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Summary</p>
              <p className="text-sm text-slate-300 leading-relaxed">{resume.summary}</p>
            </div>
          )}

          {/* Technical Skills */}
          {skills?.technical && skills.technical.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Technical Skills ({skills.technical.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.technical.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Experience ({experience.length} roles)
              </p>
              <div className="space-y-2">
                {experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <Star size={13} className="text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">{exp.role}</p>
                      <p className="text-slate-400 text-xs">{exp.company} · {exp.startDate} – {exp.endDate ?? "Present"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {expanded && !hasAIData && (
        <div className="border-t border-white/[0.05] p-5 text-center">
          <p className="text-slate-500 text-sm">
            AI extraction not run. Add your OpenAI API key to extract structured data.
          </p>
        </div>
      )}
    </div>
  );
}