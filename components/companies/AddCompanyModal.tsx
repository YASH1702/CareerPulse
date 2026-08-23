"use client";

import { useState } from "react";
import { Plus, Building2, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createCompanyAction } from "@/actions/companies";

export function AddCompanyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await createCompanyAction(fd);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to add company.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1000);
    }
  };

  return (
    <>
      <button
        onClick={() => { setError(null); setSuccess(false); setIsOpen(true); }}
        className="btn-primary text-xs flex items-center gap-1.5"
      >
        <Plus size={14} />
        <span>Add Company</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#0d1527]">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 size={16} className="text-blue-400" />
                Track a New Company
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                  <CheckCircle2 size={14} />
                  <span>Company added successfully!</span>
                </div>
              )}

              <div>
                <label className="label-field text-xs">Company Name *</label>
                <input name="name" required placeholder="e.g. OpenAI, Stripe, Netflix" className="input-field py-2 text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-xs">Website</label>
                  <input name="website" type="url" placeholder="https://company.com" className="input-field py-2 text-xs" />
                </div>
                <div>
                  <label className="label-field text-xs">Industry</label>
                  <input name="industry" placeholder="e.g. Fintech, AI, SaaS" className="input-field py-2 text-xs" />
                </div>
                <div>
                  <label className="label-field text-xs">Size</label>
                  <select name="size" className="input-field py-2 text-xs">
                    <option value="">Select size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="label-field text-xs">Location</label>
                  <input name="location" placeholder="e.g. San Francisco / Remote" className="input-field py-2 text-xs" />
                </div>
              </div>

              <div>
                <label className="label-field text-xs">Internal Notes / Culture</label>
                <textarea name="notes" rows={3} placeholder="Notes on engineering culture, interview tips, recruiters..." className="input-field text-xs resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-xs flex items-center gap-1.5">
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Save Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}