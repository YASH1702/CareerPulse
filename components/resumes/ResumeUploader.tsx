"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
  wordCount?: number;
  extracted?: boolean;
}

export function ResumeUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const handleFile = useCallback((f: File) => {
    setFile(f);
    // Auto-generate name from filename
    const autoName = f.name
      .replace(/\.(pdf|docx|doc)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setName(autoName);
    setState({ status: "idle" });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setState({ status: "uploading" });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name);

    try {
      const res = await fetch("/api/resumes/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error || "Upload failed" });
        return;
      }

      setState({
        status: "success",
        wordCount: data.wordCount,
        extracted: data.extracted,
        message: data.extracted
          ? "Resume uploaded and AI-extracted successfully!"
          : "Resume uploaded. Add your OpenAI API key to enable AI extraction.",
      });

      setTimeout(() => router.refresh(), 1500);
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  };

  const reset = () => {
    setFile(null);
    setName("");
    setState({ status: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 p-8 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
        <CheckCircle2 size={32} className="text-emerald-400" />
        <p className="text-emerald-400 font-medium text-sm">{state.message}</p>
        {state.wordCount && (
          <p className="text-slate-500 text-xs">{state.wordCount} words extracted</p>
        )}
        <button onClick={reset} className="btn-ghost text-xs mt-2">Upload another</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-blue-500/60 bg-blue-500/5"
            : file
            ? "border-white/10 bg-white/[0.02]"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(0)} KB · {file.type.includes("pdf") ? "PDF" : "DOCX"}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); reset(); }}
              className="ml-2 text-slate-500 hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-300 text-sm font-medium mb-1">
              Drop your resume here or click to browse
            </p>
            <p className="text-slate-600 text-xs">PDF or DOCX · Max 5MB</p>
          </>
        )}
      </div>

      {/* Error */}
      {state.status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      {/* Name + upload button */}
      {file && (
        <div className="space-y-3">
          <div>
            <label className="label-field">Resume name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Master Resume, Frontend CV..."
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={state.status === "uploading"}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {state.status === "uploading" ? (
              <><Loader2 size={15} className="animate-spin" />Uploading &amp; extracting...</>
            ) : (
              <><Upload size={15} />Upload Resume</>
            )}
          </button>
          {state.status === "uploading" && (
            <p className="text-xs text-slate-500 text-center">
              AI is reading your resume… this takes ~10 seconds
            </p>
          )}
        </div>
      )}
    </div>
  );
}