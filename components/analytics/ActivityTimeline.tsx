import { formatRelativeDate } from "@/utils/format";
import { Clock, Send, CheckCircle2, ArrowRight } from "lucide-react";
import type { ApplicationEvent } from "@prisma/client";

interface Props {
  events: Array<
    ApplicationEvent & {
      application: {
        job: { title: string; companyName: string };
      };
    }
  >;
}

export function ActivityTimeline({ events }: Props) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <span>Recent Activity &amp; Audit Trail</span>
        </h3>
        <span className="text-xs text-slate-500">Last 10 events</span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">
          No application status events recorded yet. Move cards on the Kanban to see audit history.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Send size={11} />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {ev.application.job.title} · <span className="text-slate-400">{ev.application.job.companyName}</span>
                  </p>
                  <p className="text-slate-400 mt-0.5">{ev.description}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">
                {formatRelativeDate(ev.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}