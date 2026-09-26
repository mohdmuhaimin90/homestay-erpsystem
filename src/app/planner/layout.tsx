import React from "react";
import PlannerHeader from "@/components/planner/PlannerHeader";

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <PlannerHeader />
      <main className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 pb-24">
        {children}
      </main>
      <footer className="py-6 bg-slate-100 border-t border-slate-200 text-center">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Homestay Planner • Mod Parents Bersatu
        </p>
      </footer>
    </div>
  );
}
