"use client";

import { useEffect, useState } from "react";
import { Settings, Database, CheckCircle2, AlertTriangle, ShieldCheck, Server, Key } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setDbTestResult(null);

    if (!isSupabaseConfigured || !supabase) {
      setDbTestResult("Supabase URL / Anon Key belum dimasukkan dalam fail .env.local atau Coolify Environment Variables. Sistem kini menggunakan Local/Demo Mode.");
      setTesting(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("properties").select("count").limit(1);
      if (error) {
        setDbTestResult(`Ralat Sambungan Supabase: ${error.message}. Pastikan anda sudah menjalankan skrip SQL supabase-schema.sql di dashboard Supabase.`);
      } else {
        setDbTestResult("✅ Sambungan ke Supabase PostgreSQL berjaya! Pangkalan data sedia menerima data.");
      }
    } catch (err: any) {
      setDbTestResult(`Ralat: ${err.message || "Gagal menghubungi Supabase."}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" /> Tetapan Sistem & Konfigurasi Supabase
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Status sambungan awan, persekitaran deployment Coolify, dan pangkalan data.
        </p>
      </div>

      {/* Supabase Status Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSupabaseConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Status Pangkalan Data Supabase</h2>
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured ? "Pautan API dikesan aktif" : "Mod Demo / Local Storage"}
              </p>
            </div>
          </div>

          <button
            onClick={testConnection}
            disabled={testing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            {testing ? "Menguji..." : "Uji Sambungan Database"}
          </button>
        </div>

        {dbTestResult && (
          <div className={`p-4 rounded-lg text-xs font-medium ${
            dbTestResult.startsWith("✅")
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}>
            {dbTestResult}
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800">Cara Memasukkan Kunci Supabase:</h3>
          <p className="text-slate-600">
            Buka fail <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-emerald-700">.env.local</code> di dalam folder projek (atau masukkan di bahagian <strong>Environment Variables</strong> dalam dashboard Coolify):
          </p>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1">
            <div>NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
          </div>
        </div>
      </div>

      {/* Deployment & VPS Architecture Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" /> Maklumat Seni Bina Deployment (RM0 Stack)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">VPS Server:</span>
            <div className="font-bold text-slate-900 mt-1">Oracle Cloud Always Free</div>
            <div className="text-[11px] text-emerald-600 font-medium">4 OCPU ARM64 / 24GB RAM</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">PaaS Manager:</span>
            <div className="font-bold text-slate-900 mt-1">Coolify Self-Hosted</div>
            <div className="text-[11px] text-emerald-600 font-medium">Auto SSL (Let's Encrypt)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-medium">Database:</span>
            <div className="font-bold text-slate-900 mt-1">Supabase PostgreSQL</div>
            <div className="text-[11px] text-emerald-600 font-medium">Row Level Security & Cloud</div>
          </div>
        </div>
      </div>
    </div>
  );
}
