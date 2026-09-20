"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileUp, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  Layers,
  Calendar,
  Building,
  Check,
  Clipboard
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ImportPage() {
  const { t, language } = useLanguage();
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);

  const plannerApiUrl = "https://ais-pre-fwyyjvsod46ojedyaguepf-355143251389.asia-southeast1.run.app/api/bookings";

  // Sample data simulating full-year bookings from January to present
  const fullYearSampleJson = `{
  "kemaman-1": {
    "2026-01-05": { "booked": true, "price": 250, "source": "direct", "comment": "Haji Zainal - 0129881122" },
    "2026-01-06": { "booked": true, "price": 250, "source": "direct", "comment": "Haji Zainal - 0129881122" },
    "2026-02-14": { "booked": true, "price": 250, "source": "direct", "comment": "Faizal - 0134455667" },
    "2026-02-15": { "booked": true, "price": 250, "source": "direct", "comment": "Faizal - 0134455667" },
    "2026-03-20": { "booked": true, "price": 295, "source": "airbnb", "comment": "Sarah Wong - 0167788990" },
    "2026-04-10": { "booked": true, "price": 250, "source": "direct", "comment": "Cikgu Razak - 0192233445" },
    "2026-05-01": { "booked": true, "price": 250, "source": "direct", "comment": "Pak Mail Hari Pekerja - 0178899001" },
    "2026-05-02": { "booked": true, "price": 250, "source": "direct", "comment": "Pak Mail Hari Pekerja - 0178899001" },
    "2026-06-12": { "booked": true, "price": 305, "source": "booking", "comment": "Dr. Kamarul - 0112345678" },
    "2026-07-18": { "booked": true, "price": 250, "source": "direct", "comment": "Ustaz Hilmi - 0199988776" },
    "2026-08-30": { "booked": true, "price": 250, "source": "direct", "comment": "Cuti Merdeka En. Azman - 0123456789" },
    "2026-08-31": { "booked": true, "price": 250, "source": "direct", "comment": "Cuti Merdeka En. Azman - 0123456789" },
    "2026-09-19": { "booked": true, "price": 250, "source": "direct", "comment": "En. Azman - 0123456789" },
    "2026-09-20": { "booked": true, "price": 250, "source": "direct", "comment": "En. Azman - 0123456789" }
  },
  "kemaman-2": {
    "2026-01-12": { "booked": true, "price": 220, "source": "direct", "comment": "Ahmad Albab - 0123344112" },
    "2026-02-28": { "booked": true, "price": 260, "source": "airbnb", "comment": "Puan Zaiton - 0145566778" },
    "2026-03-15": { "booked": true, "price": 220, "source": "direct", "comment": "Cik Laila - 0189900112" },
    "2026-04-18": { "booked": true, "price": 220, "source": "direct", "comment": "Keluarga En. Roslan - 0198877665" },
    "2026-05-25": { "booked": true, "price": 270, "source": "booking", "comment": "Tan Sri Halim - 0122233445" },
    "2026-06-20": { "booked": true, "price": 220, "source": "direct", "comment": "Siti Nurhaliza - 0134567891" },
    "2026-07-05": { "booked": true, "price": 220, "source": "direct", "comment": "Ustaz Wan - 0177788990" },
    "2026-08-15": { "booked": true, "price": 260, "source": "airbnb", "comment": "Puan Huda - 0198765432" },
    "2026-09-19": { "booked": true, "price": 220, "source": "direct", "comment": "Puan Huda - 0198765432" }
  },
  "gong-badak": {
    "2026-01-20": { "booked": true, "price": 300, "source": "direct", "comment": "Rombongan Cikgu - 0199911223" },
    "2026-02-10": { "booked": true, "price": 350, "source": "airbnb", "comment": "Farid Kamil - 0133344556" },
    "2026-03-05": { "booked": true, "price": 300, "source": "direct", "comment": "En. Bakar Gong Badak - 0122211445" },
    "2026-04-22": { "booked": true, "price": 300, "source": "direct", "comment": "Majlis Kahwin En. Syukri - 0188899776" },
    "2026-05-18": { "booked": true, "price": 365, "source": "booking", "comment": "Datuk Seri Jeffrey - 0128899334" },
    "2026-06-08": { "booked": true, "price": 300, "source": "direct", "comment": "Family Day Unisza - 0197766554" },
    "2026-07-25": { "booked": true, "price": 300, "source": "direct", "comment": "Puan Aini - 0139988771" },
    "2026-08-20": { "booked": true, "price": 350, "source": "airbnb", "comment": "Tan Wei Lun - 0123344556" },
    "2026-09-25": { "booked": true, "price": 300, "source": "direct", "comment": "Tan Wei Lun - 0123344556" }
  }
}`;

  // Try direct browser fetch (leveraging current browser session)
  const handleBrowserDirectFetch = async () => {
    setIsSyncing(true);
    setStatus("Sedang menarik data terus dari Google AI Studio melalui pelayar anda...");
    setSummary(null);

    try {
      const res = await fetch(plannerApiUrl, {
        headers: {
          "x-api-key": "hermes_homestay_secret_key_2026",
          "Accept": "application/json",
        },
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        // Submit to ERP backend to parse & merge
        await sendDataToBackend(data);
      } else {
        throw new Error("Pelayar memerlukan anda membuka pautan di tab baru untuk membenarkan cookie Google.");
      }
    } catch (err: any) {
      console.warn("Direct fetch needs tab open:", err);
      setStatus("⚠️ Pautan Google AI Studio memerlukan anda membuka tab tersebut sekali.");
    } finally {
      setIsSyncing(false);
    }
  };

  const sendDataToBackend = async (data: any) => {
    const res = await fetch("/api/sync-planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const result = await res.json();

    if (result.success) {
      if (typeof window !== "undefined") {
        if (result.bookings && Array.isArray(result.bookings)) {
          localStorage.setItem("homestay_bookings", JSON.stringify(result.bookings));
        }
        if (result.guests && Array.isArray(result.guests)) {
          localStorage.setItem("homestay_guests", JSON.stringify(result.guests));
        }
      }
      setStatus(`✅ Selesai! Berjaya menyelaraskan ${result.totalReservations || 0} rekod tempahan ke dalam kalendar!`);
      setSummary(result);
    } else {
      setStatus(`Ralat: ${result.error || "Gagal memproses data."}`);
    }
  };

  const handleResetDummyData = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("homestay_bookings", "[]");
      localStorage.setItem("homestay_guests", "[]");
      localStorage.removeItem("homestay_properties");
      alert("Semua data telah dikosongkan. Kalendar kini bersih dan sedia untuk data sebenar anda.");
      window.location.href = "/calendar";
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) {
      alert("Sila masukkan atau tampal data JSON Booking Planner!");
      return;
    }

    setIsSyncing(true);
    setStatus("Sedang memproses dan menyelaraskan tarikh tempahan (Januari - Sekarang)...");
    setSummary(null);

    try {
      const parsed = JSON.parse(jsonInput);
      await sendDataToBackend(parsed);
    } catch (err: any) {
      setStatus(`Ralat Format JSON: Sila pastikan teks yang disalin sah. (${err.message})`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-800/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{t("import.badge", "MIGRASI DATA PENUH (JANUARI - SEKARANG)")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t("import.title_part1", "Import Penuh")}{" "}
            <span className="text-indigo-400">{t("import.title_part2", "Booking Planner")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t("import.desc", "Pindahkan rekod tempahan lengkap dari Google AI Studio bagi Kemaman 1, Kemaman 2, dan Gong Badak ke dalam sistem ERP. Tarikh berturutan akan automatik digabungkan menjadi tempahan sebenar.")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={plannerApiUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#111726] hover:bg-slate-800 text-indigo-300 border border-indigo-800/50 rounded-xl text-xs font-bold transition shadow-md"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            <span>{t("import.open_api_btn", "Buka Link API Planner")}</span>
          </a>
        </div>
      </div>

      {/* Success Summary Box */}
      {summary && summary.success && (
        <div className="p-6 rounded-3xl bg-emerald-950/50 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {t("import.success_title", "Import Penuh Berjaya!")}
                </h3>
                <p className="text-xs text-emerald-300">
                  {t("import.success_desc", "Semua rekod tempahan dari Januari hingga sekarang telah dimasukkan.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/calendar"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                {t("import.view_calendar", "Lihat di Kalendar →")}
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-[#0D121D] hover:bg-slate-800 text-white font-bold rounded-xl text-xs border border-slate-700 transition"
              >
                {t("import.to_dashboard", "Ke Dashboard")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#080B11]/80 border border-emerald-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t("import.stat_total_bookings", "Jumlah Tempahan")}
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {summary.totalReservations} {t("import.unit_resv", "Tempahan")}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#080B11]/80 border border-emerald-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t("import.stat_total_nights", "Jumlah Malam Ditempah")}
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {summary.totalNights} {t("import.unit_nights", "Malam")}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#080B11]/80 border border-emerald-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t("import.stat_breakdown", "Pecahan Unit Homestay")}
              </span>
              <div className="text-xs text-slate-200 mt-1 space-y-0.5">
                {summary.homestaySummaries && Object.entries(summary.homestaySummaries).map(([name, s]: any) => (
                  <div key={name} className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-300">{name}:</span>
                    <span className="font-bold text-indigo-300">
                      {s.reservations} {t("import.unit_resv", "resv")} ({s.nights} {t("import.unit_nights", "m")})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {status && !summary && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          status.startsWith("✅") 
            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" 
            : status.startsWith("⚠️")
            ? "bg-amber-950/80 text-amber-300 border border-amber-800"
            : "bg-rose-950/80 text-rose-300 border border-rose-800"
        }`}>
          {status}
        </div>
      )}

      {/* Step by Step Guide & Import Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3 Quick Steps */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-indigo-400" />
              <span>{t("import.steps_title", "3 Langkah Mudah Memindahkan Semua Data:")}</span>
            </h2>

            <ol className="space-y-3 text-slate-300 leading-relaxed">
              <li className="p-3 bg-[#111726] rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  {t("import.step1_title", "Buka Link Data Planner")}
                </div>
                <p className="text-[11px] text-slate-400">
                  {t("import.step1_desc", "Klik butang biru di bawah untuk buka data JSON Booking Planner anda di tab baru pelayar.")}
                </p>
                <a
                  href={plannerApiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline"
                >
                  <span>{t("import.step1_link", "Buka Tab Data Booking Planner")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>

              <li className="p-3 bg-[#111726] rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                  {t("import.step2_title", "Salin Semua Teks (Copy)")}
                </div>
                <p className="text-[11px] text-slate-400">
                  {t("import.step2_desc", "Di tab baru yang terbuka, tekan Ctrl + A (Select All), kemudian tekan Ctrl + C (Copy).")}
                </p>
              </li>

              <li className="p-3 bg-[#111726] rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                  {t("import.step3_title", "Tampal & Tekan Import")}
                </div>
                <p className="text-[11px] text-slate-400">
                  {t("import.step3_desc", "Tampal (Ctrl + V) ke dalam kotak teks di sebelah dan tekan butang hijau. Sistem automatik menyusun tempahan mengikut tarikh sebenar!")}
                </p>
              </li>
            </ol>
          </div>
        </div>

        {/* Right: Paste Box & Import Trigger */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">{t("import.paste_title", "Kotak Tampal Data (JSON)")}</h2>
              <p className="text-xs text-slate-400">{t("import.paste_desc", "Tampal teks JSON yang disalin dari Google AI Studio di sini.")}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetDummyData}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/60"
                title="Padam data contoh dan kosongkan kalendar"
              >
                🗑️ Reset / Kosongkan Data Contoh
              </button>
            </div>
          </div>

          <textarea
            rows={14}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={t("import.placeholder", "Tampal data JSON Booking Planner anda di sini... (Ctrl + V)")}
            className="w-full p-4 bg-[#080B11] border border-slate-800 rounded-2xl text-xs font-mono text-cyan-300 focus:border-indigo-500 focus:outline-hidden leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500">
              {t("import.note_merge", "*Tarikh berturutan dengan tetamu sama akan automatik digabungkan.")}
            </span>
            <button
              onClick={handleImportJson}
              disabled={isSyncing}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2 shrink-0"
            >
              <FileUp className="w-4 h-4" />
              <span>{isSyncing ? t("import.btn_importing", "Sedang Memproses Rekod...") : t("import.btn_import_all", "Import Semua Tempahan (Jan - Sekarang)")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}