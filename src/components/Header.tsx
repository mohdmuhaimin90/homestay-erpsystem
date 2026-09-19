"use client";

import Link from "next/link";
import { Search, Bell, Download, Plus, ChevronDown } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Header() {
  return (
    <header className="h-20 bg-[#080B11]/90 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumbs & Page Title */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span>StayVault</span>
          <span>/</span>
          <span>Damai Homestay</span>
          <span>/</span>
          <span className="text-indigo-400 font-semibold">Dashboard</span>
        </div>
        <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
          Overview
        </h1>
      </div>

      {/* Right Controls matching StayVault image */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search guests, reservations, rooms..."
            className="w-full pl-9 pr-4 py-2 bg-[#0E1320] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Bell notification */}
        <button className="w-9 h-9 rounded-xl bg-[#0E1320] border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition">
          <Bell className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E1320] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition">
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export</span>
        </button>

        {/* New Booking Pill Button (Glowing Indigo) */}
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </Link>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#182035] border border-indigo-500/40 text-indigo-300 font-black text-xs flex items-center justify-center">
            MM
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">Mohd M.</div>
            <div className="text-[10px] text-slate-400">Manager</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500 hidden lg:block" />
        </div>
      </div>
    </header>
  );
}