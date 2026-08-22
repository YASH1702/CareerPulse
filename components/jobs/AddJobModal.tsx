"use client";

import { useState } from "react";
import { Plus, Sparkles, X, Loader2, Link2, Building, Briefcase, MapPin, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { createJobAction, extractJobFromTextAction } from "@/actions/jobs";
import type { AIJobExtraction } from "@/types/ai";

export function AddJobModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form Fields State
  const [formState, setFormState] = useState<{
    title: string;
    companyName: string;
    location: string;
    remoteType: string;
    employmentType: string;
    salaryText: string;
    salaryMin: string;
    salaryMax: string;
    applicationUrl: string;
    requiredSkills: string;
    preferredSkills: string;
    responsibilities: string;
    description: string;
  }>({
    title: "",
    companyName: "",
    location: "",
    remoteType: "UNSPECIFIED",
    employmentType: "FULL_TIME",
    salaryText: "",
    salaryMin: "",
    salaryMax: "",
    applicationUrl: "",
    requiredSkills: "",
    preferredSkills: "",
    responsibilities: "",
    description: "",
  });

  const reset = () => {
    setRawText("");
    setError(null);
    setSuccess(false);
    setFormState({
      title: "",
      companyName: "",
      location: "",
      remoteType: "UNSPECIFIED",
      employmentType: "FULL_TIME",
      salaryText: "",
      salaryMin: "",
      salaryMax: "",
      applicationUrl: "",
      requiredSkills: "",
      preferredSkills: "",
      responsibilities: "",
      description: "",
    });
  };

  const handleExtractAI = async () => {
    if (!rawText.trim()) {
      setError("Please paste a job description first.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    const res = await extractJobFromTextAction(rawText);
    setIsExtracting(false);

    if (!res.success || !res.data) {
      setError(res.error || "Failed to parse text. Please enter details manually.");
      setMode("manual");
      return;
    }

    const d: AIJobExtraction = res.data;
    setFormState({
      title: d.title || "",
      companyName: d.companyName || "",
      location: d.location || "",
      remoteType: d.remoteType || "UNSPECIFIED",
      employmentType: d.employmentType || "FULL_TIME",
      salaryText: d.salaryText || "",
      salaryMin: d.salaryMin ? String(d.salaryMin) : "",
      salaryMax: d.salaryMax ? String(d.salaryMax) : "",
      applicationUrl: d.applicationUrl || "",
      requiredSkills: (d.requiredSkills || []).join(", "),
      preferredSkills: (d.preferredSkills || []).join(", "),
      responsibilities: (d.responsibilities || []).join("\n"),
      description: rawText,
    });

    setMode("manual");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await createJobAction(fd);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to save job.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      reset();
      setIsOpen(false);
    }, 1200);
  };

  return (
    <>
      <button
        onClick={() => { reset(); setIsOpen(true); }}
        className="btn-primary flex items-center gap-2"
      >
        <Plus size={16} />
        <span>Add Job</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#0d1527]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-400" />
                  Add a New Job Opportunity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste description for AI parsing or fill in the details manually
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-white/[0.06] bg-white/[0.02] px-5 pt-3 gap-3">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  mode === "ai"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles size={15} />
                AI Fast Parser
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  mode === "manual"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building size={15} />
                Detailed Form
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Job added successfully!</span>
                </div>
              )}

              {mode === "ai" ? (
                <div className="space-y-4">
                  <div>
                    <label className="label-field">
                      Paste Job Description or LinkedIn / Portal Post Text
                    </label>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste the full job description here... AI will extract the role, company, skills, location, salary, and requirements automatically."
                      rows={10}
                      className="input-field resize-none font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("manual")}
                      className="btn-ghost text-sm"
                    >
                      Skip to manual form
                    </button>
                    <button
                      type="button"
                      onClick={handleExtractAI}
                      disabled={isExtracting || !rawText.trim()}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>AI Parsing Description...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Parse with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">Job Title *</label>
                      <input
                        name="title"
                        required
                        value={formState.title}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                        placeholder="e.g. Senior Full Stack Engineer"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-field">Company Name *</label>
                      <input
                        name="companyName"
                        required
                        value={formState.companyName}
                        onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                        placeholder="e.g. Google, Stripe, Microsoft"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-field">Location</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          name="location"
                          value={formState.location}
                          onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                          placeholder="e.g. Pune, India / Remote"
                          className="input-field pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-field">Workplace Type</label>
                      <select
                        name="remoteType"
                        value={formState.remoteType}
                        onChange={(e) => setFormState({ ...formState, remoteType: e.target.value })}
                        className="input-field"
                      >
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                        <option value="ONSITE">On-site</option>
                        <option value="UNSPECIFIED">Unspecified</option>
                      </select>
                    </div>

                    <div>
                      <label className="label-field">Employment Type</label>
                      <select
                        name="employmentType"
                        value={formState.employmentType}
                        onChange={(e) => setFormState({ ...formState, employmentType: e.target.value })}
                        className="input-field"
                      >
                        <option value="FULL_TIME">Full-Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="PART_TIME">Part-Time</option>
                        <option value="FREELANCE">Freelance</option>
                        <option value="INTERNSHIP">Internship</option>
                      </select>
                    </div>

                    <div>
                      <label className="label-field">Salary Text / Range</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          name="salaryText"
                          value={formState.salaryText}
                          onChange={(e) => setFormState({ ...formState, salaryText: e.target.value })}
                          placeholder="e.g. ₹15L - ₹25L or $120k/yr"
                          className="input-field pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-field">Application URL / Job Post Link</label>
                    <div className="relative">
                      <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        name="applicationUrl"
                        type="url"
                        value={formState.applicationUrl}
                        onChange={(e) => setFormState({ ...formState, applicationUrl: e.target.value })}
                        placeholder="https://company.com/careers/job-123"
                        className="input-field pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-field">Required Skills (comma separated)</label>
                    <input
                      name="requiredSkills"
                      value={formState.requiredSkills}
                      onChange={(e) => setFormState({ ...formState, requiredSkills: e.target.value })}
                      placeholder="React, TypeScript, Next.js, Node.js, PostgreSQL"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Preferred / Bonus Skills (comma separated)</label>
                    <input
                      name="preferredSkills"
                      value={formState.preferredSkills}
                      onChange={(e) => setFormState({ ...formState, preferredSkills: e.target.value })}
                      placeholder="Docker, AWS, GraphQL, Tailwind CSS"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label-field">Key Responsibilities (one per line)</label>
                    <textarea
                      name="responsibilities"
                      value={formState.responsibilities}
                      onChange={(e) => setFormState({ ...formState, responsibilities: e.target.value })}
                      rows={3}
                      placeholder="Design and develop front-end architecture&#10;Collaborate with product and design teams"
                      className="input-field resize-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="label-field">Full Job Description</label>
                    <textarea
                      name="description"
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      rows={4}
                      placeholder="Optional full text description..."
                      className="input-field resize-none text-xs"
                    />
                  </div>

                  <input type="hidden" name="rawDescription" value={formState.description} />
                  <input type="hidden" name="source" value="MANUAL" />

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setMode("ai")}
                      className="btn-ghost text-sm"
                    >
                      Back to AI Parser
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Saving Opportunity...</span>
                        </>
                      ) : (
                        <span>Save Opportunity</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}