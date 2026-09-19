"use client";

import { useState } from "react";
import { 
  FileUp, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  Layers,
  Key
} from "lucide-react";
import { saveGuest, saveBooking } from "@/lib/supabase";

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDetails, setSyncDetails] = useState<string | null>(null);

  const samplePlannerJson = `{
  "kemaman-1": {
    "2026-09-20": {
      "booked": true,
      "price": 250,
      "source": "direct",
      "comment": "En. Azman - 0123456789"
    },
    "2026-09-21": {
      "booked": true,
      "price": 250,
      "source": "direct",
      "comment": "En. Azman - 0123456789"
    }
  },
  "kemaman-2": {
    "2026-09-19": {
      "booked": true,
      "price": 220,
      "source": "airbnb",
      "comment": "Puan Huda - 0198765432"
    }
  },
  "gong-badak": {
    "2026-09-25": {
      "booked": true,
      "price": 300,
      "source": "direct",
      "comment": "Tan Wei Lun - 0123344556"
    }
  }
}`;

  const handleLiveSync = async () => {
    setIsSyncing(true);
    setStatus("Menghubungi Google AI Studio Booking Planner API...");
    setSyncDetails(null);

    try {
      const res = await fetch("/api/sync-planner", { method: "POST" });
      const result = await res.json();

      if (result.success) {
        setStatus(`✅ Selesai! Berjaya menyelaraskan ${result.importedCount} rekod tempahan ke dalam sistem ERP.`);
        setSyncDetails(`Homestay terlibat: ${result.homestays?.join(", ")}`);
      } else if (result.requiresCookie) {
        setStatus("⚠️ Google Cloud Run AI Studio memerlukan token sesi peranti.");
        setSyncDetails("Kerana apps Google AI Studio berada di subdomain Cloud Run preview, sila tampal data JSON atau guna butang 'Guna Data Contoh' di bawah.");
      } else {
        setStatus(`Ralat: ${result.error || "Gagal menyelaraskan data."}`);
      }
    } catch (err: any) {
      setStatus(`Ralat sambungan: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) {
      alert("Sila masukkan atau tampal data JSON Booking Planner!");
      return;
    }

    setIsSyncing(true);
    setStatus("Memproses data JSON...");
    setSyncDetails(null);

    try {
      const res = await fetch("/api/sync-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: JSON.parse(jsonInput) }),
      });

      const result = await res.json();
      if (result.success) {
        setStatus(`✅ Berjaya! Sebanyak ${result.importedCount} tempahan dari Kemaman 1, Kemaman 2, dan Gong Badak telah dimasukkan ke pangkalan data.`);
        setSyncDetails(`Homestay terlibat: ${result.homestays?.join(", ")}`);
      } else {
        setStatus(`Ralat: ${result.error || "Gagal import."}`);
      }
    } catch (err: any) {
      setStatus(`Ralat JSON: Format tidak sah. ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-800/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>INTEGRASI GOOGLE AI STUDIO & PLANNER SYNC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Penyelarasan <span className="text-indigo-400">Booking Planner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sambungkan sistem ERP ini dengan aplikasi Booking Planner keluarga di Kemaman 1, Kemaman 2, dan Gong Badak.
          </p>
        </div>

        <button
          onClick={handleLiveSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-cyan-300" : ""}`} />
          <span>{isSyncing ? "Sedang Menyegerak..." : "Tarik Data Terkini (API)"}</span>
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          status.startsWith("✅") 
            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" 
            : status.startsWith("⚠️")
            ? "bg-amber-950/80 text-amber-300 border border-amber-800"
            : "bg-rose-950/80 text-rose-300 border border-rose-800"
        }`}>
          <div>{status}</div>
          {syncDetails && <div className="text-[11px] font-normal mt-1 opacity-90">{syncDetails}</div>}
        </div>
      )}

      {/* Main Grid: API Docs + JSON Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API & Structure Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4 text-xs">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Maklumat Sambungan API</span>
            </h2>

            <div className="space-y-2 text-slate-300">
              <div className="p-3 bg-[#111726] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Production Endpoint:</span>
                <span className="text-[11px] font-mono text-cyan-400 break-all block">
                  https://ais-pre-fwyyjvsod46ojedyaguepf-355143251389.asia-southeast1.run.app/api/bookings
                </span>
              </div>

              <div className="p-3 bg-[#111726] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Kunci Pengesahan (Header):</span>
                <span className="text-[11px] font-mono text-indigo-300 block">
                  x-api-key: hermes_homestay_secret_key_2026
                </span>
              </div>

              <div className="p-3 bg-[#111726] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Dikenalpasti:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">kemaman-1</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">kemaman-2</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">gong-badak</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Integrasi 2-Hala (Tempahan Masuk):</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Setiap tempahan baharu yang didaftarkan melalui borang ERP juga sedia dihantar ke <code className="text-indigo-400">/api/agent/book</code> di Google AI Studio Planner.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Manual JSON Importer / Syncer */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">Tampal JSON Booking Planner</h2>
              <p className="text-xs text-slate-400">Salin struktur JSON dari apps AI Studio atau gunakan data contoh.</p>
            </div>
            <button
              onClick={() => setJsonInput(samplePlannerJson)}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Isi Data Contoh (Kemaman & Gong Badak)
            </button>
          </div>

          <textarea
            rows={13}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Tampal data JSON Booking Planner di sini..."
            className="w-full p-3.5 bg-[#080B11] border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:border-indigo-500 focus:outline-hidden"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleImportJson}
              disabled={isSyncing}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              <span>{isSyncing ? "Sedang Import..." : "Import ke Supabase ERP"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}