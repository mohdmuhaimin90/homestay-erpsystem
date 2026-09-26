"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, ArrowRight, ShieldCheck, Sparkles, Building, ChevronRight } from "lucide-react";
import { PlannerData } from "@/lib/plannerTypes";
import { format } from "date-fns";

export default function PlannerHomePage() {
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/planner/bookings?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        setPlannerData(data);
      })
      .catch((err) => {
        console.error("Gagal memuat data planner:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const currentMonthKey = format(new Date(), "yyyy-MM");

  const getMonthStats = (key: "kemaman-1" | "kemaman-2" | "gong-badak") => {
    if (!plannerData || !plannerData[key]) return { bookedDays: 0, totalIncome: 0 };
    const dates = plannerData[key];
    let bookedDays = 0;
    let totalIncome = 0;

    for (const [d, entry] of Object.entries(dates)) {
      if (d.startsWith(currentMonthKey) && entry.booked) {
        bookedDays++;
        if (entry.price && entry.price > 0) {
          totalIncome += entry.price;
        }
      }
    }
    return { bookedDays, totalIncome };
  };

  const homestays = [
    {
      id: "kemaman-1",
      name: "Kemaman 1",
      subtitle: "Rumah Belakang (Room Rental)",
      rate: "RM 700 / bulan",
      color: "blue",
      href: "/planner/kemaman-1",
    },
    {
      id: "kemaman-2",
      name: "Kemaman 2",
      subtitle: "Rumah Depan (3 Bilik)",
      rate: "RM 180 / malam",
      color: "emerald",
      href: "/planner/kemaman-2",
    },
    {
      id: "gong-badak",
      name: "Gong Badak",
      subtitle: "Kuala Terengganu (4 Bilik)",
      rate: "RM 350 / malam",
      color: "indigo",
      href: "/planner/gong-badak",
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Pilih Homestay
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          Tekan mana-mana unit di bawah untuk membuka dan mengurus kalendar tempahan:
        </p>
      </div>

      {/* Homestay Cards */}
      <div className="grid gap-3.5">
        {homestays.map((item) => {
          const stats = getMonthStats(item.id as any);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.rate}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {item.subtitle}
                </p>

                {stats.bookedDays > 0 && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Bulan ini: {stats.bookedDays} malam
                    </span>
                    {stats.totalIncome > 0 && (
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        RM {stats.totalIncome.toLocaleString("ms-MY")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-xs">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Unified Architecture Info Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-md space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-tight">Sistem ERP & Supabase Bersatu</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                1 Pangkalan Data
              </span>
            </div>
            <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
              Sebarang tempahan yang disimpan atau dipadam di paparan mesra keluarga ini disegerakkan secara langsung dengan pangkalan data Supabase & Sistem ERP StayVault.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-[10px] text-slate-400 font-medium">
            StayVault v3.1 • Supabase Cloud
          </span>
          <Link
            href="/"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
          >
            <span>Buka Mod ERP Penuh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
