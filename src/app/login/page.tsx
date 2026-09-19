"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Sparkles, KeyRound, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (username.trim() === "sukriaima" && password.trim() === "lot15976") {
      if (typeof window !== "undefined") {
        localStorage.setItem("damai_erp_auth", "true");
        localStorage.setItem("damai_erp_user", "sukriaima");
      }
      router.push("/");
      router.refresh();
    } else {
      setError("Username atau password salah. Sila cuba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/20">
            🏡
          </div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase block">
            HOSPITALITY SUITE
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">StayVault ERP</h1>
          <p className="text-xs text-slate-400">Log Masuk Ahli Keluarga Homestay Damai</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sukriaima"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111726] border border-slate-800 rounded-xl text-white font-bold focus:outline-hidden focus:border-indigo-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111726] border border-slate-800 rounded-xl text-white font-bold focus:outline-hidden focus:border-indigo-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-800 text-indigo-600" />
              <span>Ingat saya di peranti ini</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? "Mengesahkan..." : "Masuk ke Sistem"}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800/80">
          Sistem Pengurusan Dalaman Keluarga · RM0 Stack
        </div>
      </div>
    </div>
  );
}