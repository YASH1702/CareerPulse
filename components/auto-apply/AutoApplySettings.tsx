"use client";

import { useState } from "react";
import { Zap, Shield, Sliders, CheckCircle2, AlertCircle, Loader2, MapPin } from "lucide-react";
import { updateAutoApplyConfigAction } from "@/actions/auto-apply";
import { INDIA_LOCATION_OPTIONS } from "@/lib/jobs/locations";
import type { AutoApplyConfig, AutoApplyMode } from "@prisma/client";

interface Props {
  initialConfig: AutoApplyConfig;
}

export function AutoApplySettings({ initialConfig }: Props) {
  const [isEnabled, setIsEnabled] = useState(initialConfig.isEnabled);
  const [mode, setMode] = useState<AutoApplyMode>(initialConfig.mode);
  const [minMatchScore, setMinMatchScore] = useState(initialConfig.minMatchScore);
  const [maxDailyApplies, setMaxDailyApplies] = useState(initialConfig.maxDailyApplies);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    initialConfig.targetStates?.length ? initialConfig.targetStates : ["all_india"]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleState = (stateId: string) => {
    if (stateId === "all_india") {
      setSelectedStates(["all_india"]);
      return;
    }
    const filtered = selectedStates.filter((s) => s !== "all_india");
    if (filtered.includes(stateId)) {
      const next = filtered.filter((s) => s !== stateId);
      setSelectedStates(next.length === 0 ? ["all_india"] : next);
    } else {
      setSelectedStates([...filtered, stateId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateAutoApplyConfigAction({
      isEnabled,
      mode,
      minMatchScore,
      maxDailyApplies,
      targetCountry: "India",
      targetStates: selectedStates,
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

  const handleToggleMaster = async (nextState: boolean) => {
    setIsEnabled(nextState);
    const res = await updateAutoApplyConfigAction({
      isEnabled: nextState,
      mode,
      minMatchScore,
      maxDailyApplies,
      targetCountry: "India",
      targetStates: selectedStates,
      enableLinkedIn: true,
      enableGreenhouse: true,
      enableLever: true,
      enableRemoteAPIs: true,
    });
    if (res.success) {
      setStatusMessage(nextState ? "Autonomous engine activated!" : "Autonomous engine paused.");
      setTimeout(() => setStatusMessage(null), 3000);
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
            onChange={(e) => handleToggleMaster(e.target.checked)}
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

      {/* Target Location / Indian States */}
      <div className="space-y-3 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin size={13} className="text-blue-400" />
            <span>🇮🇳 Target Sourcing Geography (Default: India)</span>
          </label>
          <span className="text-[10px] text-blue-400 font-medium">Auto-targeted during multi-source scraping</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {INDIA_LOCATION_OPTIONS.map((loc) => {
            const isSelected = selectedStates.includes(loc.id);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => toggleState(loc.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold"
                    : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {isSelected && <CheckCircle2 size={12} className="text-blue-400" />}
                <span>{loc.label}</span>
              </button>
            );
          })}
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