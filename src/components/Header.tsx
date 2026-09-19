"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
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
    <header className="h-20 bg-[#080B11]/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumbs & Page Title */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span>StayVault</span>
          <span>/</span>
          <span>Homestay Kenangan</span>
          <span>/</span>
          <span className="text-indigo-400 font-semibold">{uiMode === "Basic" ? "Basic" : "Pro"}</span>
        </div>
        <h1 className="text-lg font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
          {uiMode === "Basic" ? t("header.control_hub") : t("header.overview")}
        </h1>
      </div>

      {/* Center: DUAL SWITCHERS: Mode (Basic vs Pro) & Language (BM vs ENG) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mode Switcher */}
        <div className="flex items-center bg-[#0E1320] p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => toggleMode("Basic")}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
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
        <div className="flex items-center bg-[#0E1320] p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setLanguage("bm")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              language === "bm"
                ? "bg-slate-700 text-amber-300 shadow-sm border border-amber-500/30 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title="Bahasa Melayu"
          >
            <span>BM</span>
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              language === "en"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title="English"
          >
            <span>ENG</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* New Booking Pill Button */}
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("header.new_reservation")}</span>
        </Link>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-[#182035] border border-indigo-500/40 text-indigo-300 font-black text-xs flex items-center justify-center">
            SA
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">sukriaima</div>
            <div className="text-[10px] text-slate-400">{t("header.family_admin")}</div>
          </div>
          <button
            onClick={handleLogout}
            title={t("header.logout")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}