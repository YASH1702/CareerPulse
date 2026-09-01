"use client";

import { Printer } from "lucide-react";

export function PrintResumeButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
      id="print-btn"
      title="Print or Save as PDF"
    >
      <Printer size={14} />
      <span>Print / Save as PDF</span>
    </button>
  );
}