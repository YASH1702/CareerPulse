"use client";

import { useState } from "react";
import { Zap, Shield, Sliders, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateAutoApplyConfigAction } from "@/actions/auto-apply";
import type { AutoApplyConfig, AutoApplyMode } from "@prisma/client";

interface Props {
  initialConfig: AutoApplyConfig;
}

export function AutoApplySettings({ initialConfig }: Props) {
  const [isEnabled, setIsEnabled] = useState(initialConfig.isEnabled);
  const [mode, setMode] = useState<AutoApplyMode>(initialConfig.mode);
  const [minMatchScore, setMinMatchScore] = useState(initialConfig.minMatchScore);
  const [maxDailyApplies, setMaxDailyApplies] = useState(initialConfig.maxDailyApplies);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateAutoApplyConfigAction({
      isEnabled,
      mode,
      minMatchScore,
      maxDailyApplies,
      enableLinkedIn: true,
      enableGreenhouse: true,
      enableLever: true,
      enableRemoteAPIs: true,
    });

    setIsSaving(false);
    if (res.success) {
      setStatusMessage("Settings updated successfully!");
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage(res.error || "Failed to save settings.");
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Autonomous Auto-Apply Engine</h3>
            <p className="text-xs text-slate-400">
              Control daily quota limits, scoring thresholds, and execution modes.
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2 text-xs font-semibold text-white">
            {isEnabled ? "ACTIVE" : "PAUSED"}
          </span>
        </label>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
          statusMessage.includes("success")
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {statusMessage.includes("success") ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300">Execution Mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => setMode("SEMI_AUTONOMOUS")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              mode === "SEMI_AUTONOMOUS"
                ? "bg-blue-600/10 border-blue-500/40 shadow-sm"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">🛡️ Semi-Autonomous (Review First)</span>
              {mode === "SEMI_AUTONOMOUS" && <CheckCircle2 size={14} className="text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Auto-tailors resume &amp; cover letter, then queues for your 1-click review before submitting.
            </p>
          </div>

          <div
            onClick={() => setMode("FULL_AUTONOMOUS")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              mode === "FULL_AUTONOMOUS"
                ? "bg-purple-600/10 border-purple-500/40 shadow-sm"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">⚡ Full Autonomous (Zero-Touch)</span>
              {mode === "FULL_AUTONOMOUS" && <CheckCircle2 size={14} className="text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Submits applications automatically whenever a discovered job meets your match threshold.
            </p>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Min Match Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Minimum AI Match Score</span>
            <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {minMatchScore}%+
            </span>
          </div>
          <input
            type="range"
            min="65"
            max="95"
            step="5"
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-[10px] text-slate-500">
            Only jobs scoring at or above {minMatchScore}% will be queued for auto-apply.
          </p>
        </div>

        {/* Max Daily Cap */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Max Applications Per Day</span>
            <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {maxDailyApplies} / day
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={maxDailyApplies}
            onChange={(e) => setMaxDailyApplies(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <p className="text-[10px] text-slate-500">
            Current today's count: {initialConfig.todayAppliedCount} applied.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-white/[0.06] flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Sliders size={13} />}
          <span>Save Auto-Apply Configuration</span>
        </button>
      </div>
    </div>
  );
}