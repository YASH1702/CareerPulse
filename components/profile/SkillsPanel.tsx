"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { addSkillAction, deleteSkillAction } from "@/actions/profile";
import type { Skill } from "@prisma/client";

const CATEGORIES = ["LANGUAGE","FRAMEWORK","DATABASE","CLOUD","TOOL","AI","SOFT","OTHER"];
const LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","EXPERT"];
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-slate-500/20 text-slate-400",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400",
  ADVANCED: "bg-indigo-500/20 text-indigo-400",
  EXPERT: "bg-violet-500/20 text-violet-400",
};
const CAT_COLORS: Record<string, string> = {
  LANGUAGE: "bg-amber-500/10 text-amber-400",
  FRAMEWORK: "bg-blue-500/10 text-blue-400",
  DATABASE: "bg-emerald-500/10 text-emerald-400",
  CLOUD: "bg-sky-500/10 text-sky-400",
  TOOL: "bg-slate-500/10 text-slate-400",
  AI: "bg-violet-500/10 text-violet-400",
  SOFT: "bg-pink-500/10 text-pink-400",
  OTHER: "bg-slate-500/10 text-slate-300",
};

export function SkillsPanel({ skills }: { skills: Skill[] }) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const grouped = CATEGORIES.reduce<Record<string, Skill[]>>((acc, cat) => {
    acc[cat] = skills.filter((s) => s.category === cat);
    return acc;
  }, {});

  async function handleDelete(id: string) {
    setPending(id);
    await deleteSkillAction(id);
    setPending(null);
  }

  return (
    <div className="space-y-6">
      {/* Existing skills grouped by category */}
      {CATEGORIES.map((cat) => {
        const catSkills = grouped[cat];
        if (catSkills.length === 0) return null;
        return (
          <div key={cat}>
            <p className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mb-3 ${CAT_COLORS[cat]}`}>
              {cat}
            </p>
            <div className="flex flex-wrap gap-2">
              {catSkills.map((skill) => (
                <div key={skill.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg group">
                  <span className="text-sm text-slate-200">{skill.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${LEVEL_COLORS[skill.proficiency]}`}>
                    {skill.proficiency.charAt(0) + skill.proficiency.slice(1).toLowerCase()}
                  </span>
                  {skill.yearsUsed && (
                    <span className="text-slate-600 text-xs">{skill.yearsUsed}y</span>
                  )}
                  <button onClick={() => handleDelete(skill.id)} disabled={pending === skill.id}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all ml-1">
                    {pending === skill.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {skills.length === 0 && !adding && (
        <p className="text-slate-500 text-sm">No skills added yet. Add your first skill below.</p>
      )}

      {/* Add skill form */}
      {adding ? (
        <form action={async (fd) => { await addSkillAction(fd); setAdding(false); }}
          className="p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl space-y-4">
          <p className="text-sm font-medium text-slate-300">Add a Skill</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Skill Name *</label>
              <input name="name" required autoFocus
                className="input-field" placeholder="e.g. React, Python, AWS..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Category *</label>
              <select name="category" required className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Level *</label>
              <select name="proficiency" required className="input-field">
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0)+l.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="w-32">
            <label className="text-xs text-slate-500 mb-1 block">Years Used</label>
            <input name="yearsUsed" type="number" min="0" max="30" className="input-field" placeholder="e.g. 3" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Add Skill</button>
            <button type="button" onClick={() => setAdding(false)}
              className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-colors text-sm">
          <Plus size={14} /> Add Skill
        </button>
      )}
    </div>
  );
}