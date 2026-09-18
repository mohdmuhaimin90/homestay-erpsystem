"use client";

import Link from "next/link";
import { Plus, Bell, Grid, Search, MessageSquareShare } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search bar matching the reference */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings, guests, properties..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white rounded-xl border border-transparent focus:border-blue-400 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 transition"
          />
        </div>
      </div>

      {/* Right controls: Plus button, Grid, Notification, User avatar */}
      <div className="flex items-center gap-3">
        {/* Supabase status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-blue-600" : "bg-amber-500"} animate-pulse`} />
          <span>{isSupabaseConfigured ? "Supabase Live" : "Local Mode"}</span>
        </div>

        {/* WhatsApp Generator shortcut */}
        <Link
          href="/whatsapp"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          <MessageSquareShare className="w-3.5 h-3.5 text-blue-600" />
          <span>WhatsApp</span>
        </Link>

        {/* Add Booking Plus Icon */}
        <Link
          href="/bookings/new"
          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20 transition"
          title="Tempahan Baru"
        >
          <Plus className="w-4 h-4" />
        </Link>

        {/* Grid Icon */}
        <Link
          href="/calendar"
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          title="Kalendar Grid"
        >
          <Grid className="w-4 h-4" />
        </Link>

        {/* Bell with notification dot */}
        <div className="relative">
          <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#0A0D14] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            MH
          </div>
        </div>
      </div>
    </header>
  );
}