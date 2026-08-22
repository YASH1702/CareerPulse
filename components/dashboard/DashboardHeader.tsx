import { auth } from "@/auth";
import { signOutAction } from "@/actions/auth";
import { LogOut, Bell } from "lucide-react";

export async function DashboardHeader({ title }: { title?: string }) {
  const session = await auth();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex items-center justify-between mb-8">
      {title ? (
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Your job search, intelligently automated.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Notifications bell — wired up in Phase 15 */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-colors">
          <Bell size={16} />
        </button>

        {/* User avatar + sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-colors text-sm"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              {firstName[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:block">{user?.name ?? "Account"}</span>
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}