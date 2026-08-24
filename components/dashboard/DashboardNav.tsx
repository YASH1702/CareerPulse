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
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/auto-apply", label: "Auto-Apply", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recommendations", label: "Matches", icon: Star },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-56 shrink-0 h-screen border-r border-white/[0.05] bg-[#080d1a] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white leading-tight">JobPilot AI</p>
            <p className="text-[10px] text-slate-500 leading-tight">Apply smarter</p>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group",
                active ? "bg-blue-600/15 text-blue-400 font-medium"
                       : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}>
              <Icon size={15} className={cn(active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-2 py-3 border-t border-white/[0.05] space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group",
                active ? "bg-blue-600/15 text-blue-400 font-medium"
                       : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}>
              <Icon size={15} className={cn(active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </Link>
          );
        })}
        <p className="text-[10px] text-slate-600 px-3 pt-2">JobPilot AI · v1.0.0</p>
      </div>
    </aside>
  );
}