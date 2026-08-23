"use client";

import { useState } from "react";
import { Building2, Globe, MapPin, Trash2, Briefcase, ExternalLink, Bookmark } from "lucide-react";
import { deleteCompanyAction } from "@/actions/companies";
import { AddCompanyModal } from "./AddCompanyModal";
import type { Company } from "@prisma/client";

interface CompanyWithJobs extends Company {
  jobs: Array<{ id: string; title: string; matchScore: number | null; jobStatus: string }>;
}

interface Props {
  initialCompanies: CompanyWithJobs[];
}

export function CompanyList({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState<CompanyWithJobs[]>(initialCompanies);
  const [search, setSearch] = useState("");

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}" from tracked companies?`)) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      await deleteCompanyAction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracked companies by name, industry, or city..."
          className="input-field py-2 text-xs w-full sm:w-80"
        />
        <AddCompanyModal />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Building2 size={22} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No tracked companies found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Companies are automatically added when you import jobs, or you can add target companies manually.
          </p>
          <AddCompanyModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{c.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {c.industry && <span>{c.industry}</span>}
                        {c.size && <span>· {c.size}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {c.location && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{c.location}</span>
                  </p>
                )}

                {c.notes && (
                  <p className="text-xs text-slate-300 mt-2 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] line-clamp-2">
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Footer with Jobs Count & Website */}
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={12} className="text-blue-400" />
                  <span>{c.jobs.length} jobs tracked</span>
                </span>

                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Globe size={12} />
                    <span>Website</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}