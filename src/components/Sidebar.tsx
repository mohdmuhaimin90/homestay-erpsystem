"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpenCheck, 
  Home, 
  Users, 
  MessageSquareShare, 
  FileUp, 
  Settings,
  Sparkles,
  Layers
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Kalendar & Planner", href: "/calendar", icon: CalendarDays },
    { name: "Pengurusan Tempahan", href: "/bookings", icon: BookOpenCheck },
    { name: "Unit Homestay", href: "/properties", icon: Home },
    { name: "Direktori Tetamu", href: "/guests", icon: Users },
    { name: "WhatsApp & Invois", href: "/whatsapp", icon: MessageSquareShare },
    { name: "Import Data", href: "/import", icon: FileUp },
    { name: "Tetapan", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0A0D14] text-slate-200 min-h-screen flex flex-col border-r border-slate-800/80 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-600/30">
          🏡
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-white text-sm tracking-tight">DAMAI ERP</h1>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Family Homestay Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
            M
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">Admin Homestay</div>
            <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Cloud Online
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}