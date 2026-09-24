"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Calendar, ShieldCheck } from "lucide-react";

export default function PlannerHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/planner";

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg border-b border-slate-800">
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        <Link href="/planner" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight uppercase leading-tight">
              Homestay Planner
            </div>
            <div className="text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Mod Parents</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> 1 Database Bersatu
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!isHome && (
            <Link
              href="/planner"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Senarai</span>
            </Link>
          )}

          <Link
            href="/"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            title="Tukar ke Mod Pengurusan ERP Penuh"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mod ERP</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
