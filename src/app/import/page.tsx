"use client";

import { useState } from "react";
import { FileUp, Database, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { saveGuest, saveBooking, saveProperty } from "@/lib/supabase";

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const sampleJson = `[
  {
    "guest_name": "Kamarul Zaman",
    "guest_phone": "0129876543",
    "property_name": "Villa A - Poolside Garden",
    "check_in": "2026-10-01",
    "check_out": "2026-10-03",
    "total_price": 610,
    "deposit_amount": 100,
    "status": "confirmed",
    "notes": "Data dari Google AI Studio Firebase lama"
  }
]`;

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      alert("Sila tampal data JSON atau fail eksport Firebase anda!");
      return;
    }

    setIsImporting(true);
    setStatus("Memproses data...");

    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let count = 0;

      for (const item of items) {
        // Create or get guest
        const guest = await saveGuest({
          name: item.guest_name || item.name || "Tetamu Firebase",
          phone: item.guest_phone || item.phone || "0123456789",
          email: item.guest_email || item.email || "",
          notes: item.notes || "Migrasi dari Firebase",
        });

        // Create booking
        await saveBooking({
          property_id: "prop-1", // default link
          guest_id: guest.id,
          check_in: item.check_in || item.checkIn || "2026-10-01",
          check_out: item.check_out || item.checkOut || "2026-10-02",
          total_nights: 1,
          total_price: Number(item.total_price || item.totalPrice || 250),
          deposit_amount: Number(item.deposit_amount || item.deposit || 100),
          source: item.source || "direct_whatsapp",
          booking_status: item.status || "confirmed",
          payment_status: item.payment_status || "deposit_paid",
          notes: item.notes || "Imported from Firebase",
        });

        count++;
      }

      setImportedCount(count);
      setStatus(`Berjaya mengimport ${count} rekod tempahan ke dalam sistem!`);
    } catch (err: any) {
      console.error(err);
      setStatus("Ralat: Format JSON tidak sah. Sila semak struktur JSON anda.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-emerald-600" /> Alat Migrasi & Import Data Firebase
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pindahkan semua rekod tempahan lama dari Google AI Studio / Firebase Firestore terus ke pangkalan data Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step Guide */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" /> Langkah Mengambil Data dari Firebase:
          </h2>
          <ol className="list-decimal pl-4 space-y-2 text-slate-600 leading-relaxed">
            <li>Buka <strong>Firebase Console</strong> tempat anda bina apps Google AI Studio sebelum ini.</li>
            <li>Pergi ke <strong>Firestore Database</strong> &gt; pilih koleksi tempahan anda (contoh: <code>bookings</code>).</li>
            <li>Salin dokumen dalam format <strong>JSON</strong> (atau eksport).</li>
            <li>Tampal (*paste*) teks JSON tersebut ke dalam kotak teks di sebelah kanan.</li>
            <li>Tekan butang <strong>Mula Import ke Supabase</strong>.</li>
          </ol>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-4">
            <span className="font-bold text-slate-800 block mb-1">Contoh Format JSON:</span>
            <pre className="text-[10px] text-slate-700 overflow-x-auto bg-white p-2 rounded border border-slate-200">
              {sampleJson}
            </pre>
            <button
              onClick={() => setJsonInput(sampleJson)}
              className="mt-2 text-emerald-700 font-bold hover:underline text-[11px]"
            >
              Guna Contoh Format Di Atas
            </button>
          </div>
        </div>

        {/* Input Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Tampal Data JSON Firebase:</h2>
          <textarea
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Tampal JSON di sini..."
            className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />

          {status && (
            <div className={`p-3 rounded-lg text-xs font-medium ${
              status.includes("Berjaya")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}>
              {status}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2"
          >
            <FileUp className="w-4 h-4" /> {isImporting ? "Sedang Mengimport..." : "Mula Import ke Supabase"}
          </button>
        </div>
      </div>
    </div>
  );
}
