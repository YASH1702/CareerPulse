"use client";

import { useState } from "react";
import { BookOpen, X, Loader2, Sparkles, HelpCircle, CheckCircle, Lightbulb } from "lucide-react";
import { getInterviewPrepAction } from "@/actions/intelligence";
import type { InterviewPrepGuide } from "@/lib/ai/interview-prep";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export function InterviewPrepModal({ jobId, jobTitle, companyName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<InterviewPrepGuide | null>(null);

  const fetchPrep = async () => {
    setIsLoading(true);
    const res = await getInterviewPrepAction(jobId);
    setIsLoading(false);
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!data) {
      fetchPrep();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-2.5 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
      >
        <BookOpen size={12} />
        <span>Interview Cheat-Sheet</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-emerald-500/20 shadow-2xl bg-[#0d1527]">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  Role-Specific Interview Prep Cheat-Sheet
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tailored questions &amp; key talking points for <strong className="text-slate-200">{jobTitle}</strong> at <strong className="text-slate-200">{companyName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400">Analyzing job requirements &amp; generating interview questions...</p>
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Culture Brief */}
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                    <Lightbulb size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Engineering Mindset &amp; Culture Focus:</p>
                      <p className="mt-0.5 leading-relaxed">{data.companyCultureBrief}</p>
                    </div>
                  </div>

                  {/* Technical Questions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
                      <HelpCircle size={14} className="text-blue-400" />
                      Top Technical Questions Likely to Be Asked
                    </h3>
                    <div className="space-y-3">
                      {data.technicalQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-white leading-snug">
                              {idx + 1}. {q.question}
                            </h4>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded shrink-0">
                              {q.topic}
                            </span>
                          </div>
                          <div className="pl-3 border-l-2 border-emerald-500/30 space-y-1">
                            <p className="text-[11px] font-medium text-slate-400">Key Points to Mention:</p>
                            <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                              {q.modelAnswerKeyPoints.map((pt, pIdx) => (
                                <li key={pIdx} className="leading-relaxed">{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral Questions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
                      <CheckCircle size={14} className="text-purple-400" />
                      Behavioral &amp; Culture Questions (STAR Framework)
                    </h3>
                    <div className="space-y-3">
                      {data.behavioralQuestions.map((b, idx) => (
                        <div key={idx} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
                          <h4 className="text-xs font-semibold text-white">{idx + 1}. {b.prompt}</h4>
                          <p className="text-xs text-purple-300 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 leading-relaxed">
                            💡 <strong>STAR Story Tip:</strong> {b.starFrameworkTip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions to Ask Interviewer */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
                      <Lightbulb size={14} className="text-amber-400" />
                      Strategic Questions to Ask the Interviewer
                    </h3>
                    <ul className="space-y-2">
                      {data.smartQuestionsToAsk.map((sq, idx) => (
                        <li key={idx} className="text-xs text-slate-300 p-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-center gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{sq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.06] flex justify-end bg-white/[0.01]">
              <button onClick={() => setIsOpen(false)} className="btn-primary text-xs">
                Ready for Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}