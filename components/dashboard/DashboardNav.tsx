"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  FileText,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recommendations", label: "Recommendations", icon: Star },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 h-screen border-r border-white/[0.05] bg-[#080d1a] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white leading-tight">JobPilot AI</p>
            <p className="text-[10px] text-slate-500 leading-tight">Apply smarter</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                isActive
                  ? "bg-blue-600/15 text-blue-400 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.05]">
        <p className="text-[11px] text-slate-600">JobPilot AI v0.1.0</p>
      </div>
    </aside>
  );
}
