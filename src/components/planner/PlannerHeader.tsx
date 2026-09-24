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
        <Link href="/planner" className="flex flex-col">
          <span className="text-xl font-black tracking-tight uppercase">Homestay Planner</span>
          <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Availability Tracker</span>
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
            className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl text-xs font-black text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Masuk ke Sistem ERP Homestay Kenangan"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Masuk Sistem ERP</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
