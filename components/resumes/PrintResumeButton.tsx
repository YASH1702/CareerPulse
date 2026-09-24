"use client";

import { useState } from "react";
import { Download, Loader2, Check, FileText } from "lucide-react";
import { exportResumeToPdf } from "@/lib/resume/pdf-export";

interface Props {
  elementId?: string;
  filename?: string;
  resumeId?: string;
}

export function SaveResumeButton({
  elementId = "replica-resume-sheet",
  filename = "Yashwant_Kariha_Resume.pdf",
  resumeId,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSavePdf = async () => {
    setStatus("loading");
    const success = await exportResumeToPdf({
      elementId,
      filename,
    });

    if (success) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSavePdf}
        disabled={status === "loading"}
        className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-75"
        id="save-pdf-btn"
        title="Download 1-page ATS PDF directly with 1 click"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin text-white" />
            <span>Generating 1-Page PDF...</span>
          </>
        ) : status === "success" ? (
          <>
            <Check size={14} className="text-emerald-300" />
            <span className="text-emerald-100 font-bold">Saved PDF!</span>
          </>
        ) : status === "error" ? (
          <span>⚠️ Retry Save</span>
        ) : (
          <>
            <Download size={14} className="text-white" />
            <span className="font-semibold">1-Click Save PDF</span>
          </>
        )}
      </button>

      {resumeId && (
        <a
          href={`/api/resumes/${resumeId}/download?format=txt`}
          download
          className="text-xs text-slate-400 hover:text-white px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center gap-1.5 transition-all shadow-xs"
          title="Download ATS Plain Text version (.txt)"
        >
          <FileText size={13} />
          <span>Save TXT</span>
        </a>
      )}
    </div>
  );
}

// Backward compatibility alias for any existing imports
export const PrintResumeButton = SaveResumeButton;