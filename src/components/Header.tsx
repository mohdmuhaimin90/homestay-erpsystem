"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Globe, Menu } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [uiMode, setUiMode] = useState<"Basic" | "Pro">("Pro");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("damai_ui_mode");
      if (savedMode === "Basic" || savedMode === "Pro") {
        setUiMode(savedMode);
      } else if (savedMode === "EZ") {
        setUiMode("Basic");
        localStorage.setItem("damai_ui_mode", "Basic");
      }
    }
  }, []);

  const toggleMode = (mode: "Basic" | "Pro") => {
    setUiMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("damai_ui_mode", mode);
      window.dispatchEvent(new Event("ui_mode_change"));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("damai_erp_auth");
    }
    router.push("/login");
  };

  return (
    <header className="h-16 sm:h-20 bg-[#080B11]/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Hamburger + Breadcrumbs / Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>StayVault</span>
            <span>/</span>
            <span>Homestay Kenangan</span>
            <span>/</span>
            <span className="text-indigo-400 font-semibold">{uiMode === "Basic" ? "Basic" : "Pro"}</span>
          </div>
          <h1 className="text-sm sm:text-lg font-black text-white tracking-tight flex items-center gap-2 truncate">
            <span className="sm:hidden font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 text-base">
              StayVault
            </span>
            <span className="hidden sm:inline">
              {uiMode === "Basic" ? t("header.control_hub") : t("header.overview")}
            </span>
          </h1>
        </div>
      </div>

      {/* Center: DUAL SWITCHERS: Mode (Basic vs Pro) & Language (BM vs ENG) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center bg-[#0E1320] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => toggleMode("Basic")}
            className={`flex items-center gap-1 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              uiMode === "Basic"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
            title={language === "bm" ? "Paparan Basic mudah" : "Simple Basic view"}
          >
            <span>Basic</span>
          </button>
          <button
            onClick={() => toggleMode("Pro")}
            className={`flex items-center gap-1 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              uiMode === "Pro"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
            title={language === "bm" ? "Paparan Pro analitik" : "Full Analytics Pro view"}
          >
            <span>Pro</span>
          </button>
        </div>

        {/* Language Switcher [ BM | ENG ] */}
        <div className="flex items-center bg-[#0E1320] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setLanguage("bm")}
            className={`flex items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              language === "bm"
                ? "bg-slate-700 text-amber-300 shadow-xs border border-amber-500/30 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title="Bahasa Melayu"
          >
            <span>BM</span>
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`flex items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              language === "en"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title="English"
          >
            <span>EN</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* New Booking Button */}
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={t("header.new_reservation")}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">{t("header.new_reservation")}</span>
        </Link>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#182035] border border-indigo-500/40 text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
            SA
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-white leading-tight">sukriaima</div>
            <div className="text-[10px] text-slate-400">{t("header.family_admin")}</div>
          </div>
          <button
            onClick={handleLogout}
            title={t("header.logout")}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}