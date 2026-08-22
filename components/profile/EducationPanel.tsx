"use client";

import { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { addEducationAction, deleteEducationAction } from "@/actions/profile";
import type { Education } from "@prisma/client";

export function EducationPanel({ education }: { education: Education[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {education.map((edu) => (
        <div key={edu.id} className="flex items-start justify-between p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl group">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap size={15} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
              <p className="text-slate-400 text-sm">{edu.institution}</p>
              <p className="text-slate-600 text-xs mt-0.5">
                {edu.startYear && `${edu.startYear} – `}{edu.endYear ?? "Present"}
                {edu.grade && ` · ${edu.grade}`}
              </p>
            </div>
          </div>
          <button onClick={async () => { await deleteEducationAction(edu.id); }}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {education.length === 0 && !adding && (
        <p className="text-slate-500 text-sm">No education added yet.</p>
      )}

      {adding ? (
        <form action={async (fd) => { await addEducationAction(fd); setAdding(false); }}
          className="p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl space-y-4">
          <p className="text-sm font-medium text-slate-300">Add Education</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Institution *</label>
              <input name="institution" required autoFocus className="input-field"
                placeholder="e.g. University of Pune" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Degree *</label>
              <input name="degree" required className="input-field"
                placeholder="e.g. B.E., B.Tech, MCA" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Field of Study</label>
              <input name="field" className="input-field"
                placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Grade / CGPA</label>
              <input name="grade" className="input-field" placeholder="e.g. 8.5 CGPA" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Start Year</label>
              <input name="startYear" type="number" className="input-field" placeholder="2019" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">End Year</label>
              <input name="endYear" type="number" className="input-field" placeholder="2023" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-colors text-sm">
          <Plus size={14} /> Add Education
        </button>
      )}
    </div>
  );
}