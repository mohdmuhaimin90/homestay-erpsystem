"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Calendar,
  BookOpenCheck, 
  Home, 
  Users, 
  MessageSquareShare, 
  FileUp, 
  Settings,
  ChevronDown
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const operationsNav = [
    { name: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("nav.planner"), href: "/planner", icon: Calendar, badge: "Mak & Ayah" },
    { name: t("nav.reservations"), href: "/bookings", icon: BookOpenCheck, badge: "32" },
    { name: t("nav.calendar"), href: "/calendar", icon: CalendarDays },
    { name: t("nav.properties"), href: "/properties", icon: Home, badge: "3" },
    { name: t("nav.guests"), href: "/guests", icon: Users },
  ];

  const intelligenceNav = [
    { name: t("nav.whatsapp"), href: "/whatsapp", icon: MessageSquareShare },
    { name: t("nav.import"), href: "/import", icon: FileUp },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-full h-full bg-[#0B0F19] text-slate-300 flex flex-col border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase block">
              HOSPITALITY SUITE
            </span>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
              StayVault
              <span className="text-[10px] font-normal text-slate-500 font-mono">v3.1</span>
            </h1>
            <p className="text-[11px] text-slate-400">Property Management ERP</p>
          </div>
          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              aria-label="Tutup Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Property Selector Card */}
        <div className="p-2.5 rounded-xl bg-[#111726] border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-sm shadow-sm">
              🏡
            </div>
            <div>
              <div className="text-xs font-bold text-white truncate max-w-[125px]">
                Homestay Kenangan
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  KEMAMAN & KT
                </span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto text-xs">
        {/* Operations */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-wider px-3 pb-1 block">
            {t("nav.operations")}
          </span>
          {operationsNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive 
                      ? "bg-white/20 text-white" 
                      : item.badge === "Mak & Ayah" ? "bg-amber-950/80 text-amber-300 border border-amber-800/60" : item.badge === "3" ? "bg-teal-950 text-teal-300 border border-teal-800/60" : "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Intelligence */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-wider px-3 pb-1 block">
            {t("nav.intelligence")}
          </span>
          {intelligenceNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/60 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>RM0 Oracle VPS</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("nav.live_online")}
          </span>
        </div>
      </div>
    </aside>
  );
}