"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PlannerCalendar from "@/components/planner/PlannerCalendar";
import { HomestayKey, PlannerBookingEntry, IcalFeed, PlannerData } from "@/lib/plannerTypes";
import { 
  MessageSquare, X, Calendar as CalendarIcon, Info, Save, Trash2, Paperclip, 
  Upload, ExternalLink, FileText, RefreshCw, Link2, Plus, 
  CheckCircle2, AlertCircle, HelpCircle, ArrowRight, DollarSign, ArrowLeft 
} from "lucide-react";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HomestayDetailPage() {
  const params = useParams();
  const rawId = params?.homestayId as string;
  const homestayKey: HomestayKey = (rawId === "kemaman-1" || rawId === "kemaman-2" || rawId === "gong-badak")
    ? rawId
    : "kemaman-1";

  const homestayNameMap: Record<HomestayKey, string> = {
    "kemaman-1": "Homestay Kemaman 1",
    "kemaman-2": "Homestay Kemaman 2",
    "gong-badak": "Homestay Gong Badak"
  };

  const homestayName = homestayNameMap[homestayKey];

  const [bookings, setBookings] = useState<{ [date: string]: PlannerBookingEntry }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Edit states
  const [editBooked, setEditBooked] = useState(false);
  const [editSource, setEditSource] = useState<"direct" | "booking" | "airbnb" | "">("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editComment, setEditComment] = useState("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // iCal Sync states
  const [icalFeeds, setIcalFeeds] = useState<IcalFeed[]>([]);
  const [syncingIcal, setSyncingIcal] = useState(false);
  const [showIcalModal, setShowIcalModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [newFeedName, setNewFeedName] = useState("Airbnb");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [savingIcalConfig, setSavingIcalConfig] = useState(false);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/planner/bookings?t=${Date.now()}`);
      const data: PlannerData = await response.json();
      setBookings(data[homestayKey] || {});
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIcalConfig = async () => {
    try {
      const res = await fetch(`/api/planner/ical-config/${homestayKey}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setIcalFeeds(data.feeds || []);
      }
    } catch (err) {
      console.error("Failed to fetch iCal config:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchIcalConfig();
  }, [homestayKey]);

  useEffect(() => {
    if (selectedDate) {
      const key = format(selectedDate, "yyyy-MM-dd");
      const entry = bookings[key];
      const isBooked = Boolean(entry?.booked);
      setEditBooked(isBooked);

      let initialSource: "direct" | "booking" | "airbnb" | "" = "";
      if (isBooked) {
        if (entry?.source?.includes("airbnb") || entry?.syncedNote?.toLowerCase().includes("airbnb")) {
          initialSource = "airbnb";
        } else if (entry?.source?.includes("booking") || entry?.syncedNote?.toLowerCase().includes("booking")) {
          initialSource = "booking";
        } else {
          initialSource = "direct";
        }
      }
      setEditSource(initialSource);
      setEditPrice(entry?.price != null && entry?.price !== undefined ? String(entry.price) : "");

      let commentVal = entry?.comment || "";
      if (commentVal.startsWith("🔒 Synced from") && !commentVal.includes("\n") && !commentVal.includes("Nama") && !commentVal.includes("Majlis")) {
        commentVal = "";
      }
      setEditComment(commentVal);
      setEditAttachments(entry?.attachments || []);
    }
  }, [selectedDate, bookings]);

  const handleSyncNow = async () => {
    setSyncingIcal(true);
    try {
      const res = await fetch(`/api/planner/sync-ical/${homestayKey}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
        fetchIcalConfig();
        alert(`Berjaya! ${data.syncedTotal ?? 0} malam dari kalendar Airbnb / Booking.com telah disinkronkan.`);
      } else {
        alert(`Ralat semasa sync: ${data.error || "Gagal"}`);
      }
    } catch (err) {
      alert("Gagal menyinkronkan kalendar iCal.");
    } finally {
      setSyncingIcal(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl.trim()) return;

    setSavingIcalConfig(true);
    const newFeed: IcalFeed = {
      id: Date.now().toString(),
      name: newFeedName.trim() || "External Calendar",
      url: newFeedUrl.trim(),
    };

    const updatedFeeds = [...icalFeeds, newFeed];

    try {
      const res = await fetch(`/api/planner/ical-config/${homestayKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: updatedFeeds }),
      });

      if (res.ok) {
        setIcalFeeds(updatedFeeds);
        setNewFeedUrl("");
        const syncRes = await fetch(`/api/planner/sync-ical/${homestayKey}`, { method: "POST" });
        const syncData = await syncRes.json();
        fetchBookings();
        fetchIcalConfig();
        if (syncData.syncedTotal !== undefined) {
          alert(`Pautan kalendar berjaya ditambah! ${syncData.syncedTotal} malam ditempah disinkronkan.`);
        }
      }
    } catch (err) {
      alert("Gagal menyimpan pautan iCal.");
    } finally {
      setSavingIcalConfig(false);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Padam pautan kalendar ini?")) return;
    const updatedFeeds = icalFeeds.filter((f) => f.id !== feedId);
    try {
      const res = await fetch(`/api/planner/ical-config/${homestayKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: updatedFeeds }),
      });
      if (res.ok) {
        setIcalFeeds(updatedFeeds);
      }
    } catch (err) {
      alert("Gagal memadam pautan.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fail terlalu besar. Sila guna fail di bawah 5MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/planner/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const updatedAttachments = [...editAttachments, data.filename];
      setEditAttachments(updatedAttachments);
      await saveChanges(editBooked, editComment, updatedAttachments, editSource, editPrice, true);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Gagal muat naik: ${error instanceof Error ? error.message : "Masalah pelayan"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = async (index: number) => {
    const updatedAttachments = editAttachments.filter((_, i) => i !== index);
    setEditAttachments(updatedAttachments);
    await saveChanges(editBooked, editComment, updatedAttachments, editSource, editPrice, true);
  };

  const saveChanges = async (
    overrideBooked?: boolean,
    overrideComment?: string,
    overrideAttachments?: string[],
    overrideSource?: string,
    overridePrice?: string,
    stayOpen: boolean = false
  ) => {
    if (!selectedDate) return;
    setSaving(true);

    const finalBooked = overrideBooked !== undefined ? overrideBooked : editBooked;
    const rawComment = overrideComment !== undefined ? overrideComment : editComment;
    const finalComment = typeof rawComment === "string" ? rawComment.trim() : "";
    const finalAttachments = overrideAttachments !== undefined ? overrideAttachments : editAttachments;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingEntry = bookings[dateStr];

    const rawSource = overrideSource !== undefined ? overrideSource : editSource;
    const finalSource = finalBooked ? (rawSource || existingEntry?.source || "direct") : "";

    const rawPrice = overridePrice !== undefined ? overridePrice : editPrice;
    let finalPrice: number | null = null;
    if (finalBooked && rawPrice !== "" && rawPrice !== null && rawPrice !== undefined) {
      const num = Number(rawPrice);
      if (!isNaN(num) && num >= 0) {
        finalPrice = num;
      }
    }

    const finalSyncedNote = finalBooked ? (existingEntry?.syncedNote || "") : "";
    const isCompletelyEmpty = !finalBooked && !finalComment && finalAttachments.length === 0 && finalPrice === null && !finalSyncedNote;

    setBookings((prev) => {
      const newBookings = { ...prev };
      if (isCompletelyEmpty) {
        delete newBookings[dateStr];
      } else {
        newBookings[dateStr] = {
          booked: finalBooked,
          comment: finalComment,
          attachments: finalAttachments,
          source: finalSource,
          syncedNote: finalSyncedNote,
          price: finalPrice,
        };
      }
      return newBookings;
    });

    try {
      const response = await fetch("/api/planner/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homestay: homestayKey,
          date: dateStr,
          booked: finalBooked,
          comment: finalComment,
          attachments: finalAttachments,
          source: finalSource,
          syncedNote: finalSyncedNote,
          price: finalPrice,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Server error";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const resData = await response.json();
      if (resData.bookings) {
        setBookings(resData.bookings);
      }

      if (!stayOpen) {
        setSelectedDate(null);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Maaf, simpanan gagal: ${error instanceof Error ? error.message : String(error)}`);
      fetchBookings();
    } finally {
      setSaving(false);
    }
  };

  const resetDate = () => {
    setEditBooked(false);
    setEditSource("");
    setEditPrice("");
    setEditComment("");
    setEditAttachments([]);
    saveChanges(false, "", [], "", "", false);
  };

  const getAttachmentUrl = (file: string) => {
    if (file.startsWith("http")) return file;
    return `/uploads/${file}`;
  };

  const getAttachmentName = (file: string) => {
    if (file.startsWith("http")) {
      try {
        const url = new URL(file);
        const pathParts = url.pathname.split("/");
        const encodedFilename = pathParts[pathParts.length - 1];
        const decoded = decodeURIComponent(encodedFilename).split("/").pop() || "File";
        return decoded.split("-").slice(2).join("-") || decoded;
      } catch {
        return "Cloud File";
      }
    }
    return file.split("-").slice(2).join("-") || file;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuatkan Kalendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Link href="/planner" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Senarai Homestay</span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{homestayName}</h2>
          <p className="text-xs text-slate-500 font-semibold">Tahun {new Date().getFullYear()} • Mod Mesra Pengguna</p>
        </div>
      </div>

      {/* External Calendar Sync Section (Airbnb / Booking.com) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <RefreshCw className={cn("w-5 h-5 text-blue-300", syncingIcal && "animate-spin")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Sinkronisasi Kalendar Luar</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Auto Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {icalFeeds.length === 0 
                  ? "Sambungkan pautan iCal Airbnb / Booking.com untuk kemas kini automatik." 
                  : `${icalFeeds.length} pautan kalendar disambungkan.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSyncNow}
              disabled={syncingIcal || icalFeeds.length === 0}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", syncingIcal && "animate-spin")} />
              <span>{syncingIcal ? "Syncing..." : "Sync Sekarang"}</span>
            </button>

            <button
              onClick={() => setShowIcalModal(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-blue-300" />
              <span>{icalFeeds.length === 0 ? "Tambah Pautan" : "Urus Pautan"}</span>
            </button>
          </div>
        </div>

        {/* Active Feeds Summary Pills */}
        {icalFeeds.length > 0 && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
            {icalFeeds.map((feed) => (
              <div key={feed.id} className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] flex items-center gap-1.5">
                <span className="font-bold text-white">{feed.name}</span>
                {feed.status === "ok" ? (
                  <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {feed.syncedCount !== undefined ? `${feed.syncedCount} malam` : "OK"}
                  </span>
                ) : feed.status === "error" ? (
                  <span className="text-[10px] text-rose-300 flex items-center gap-1 font-semibold" title={feed.errorMessage}>
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Ralat
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Belum sync</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide Banner */}
      <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-900 font-bold">
          Tekan mana-mana tarikh pada kalendar untuk menempah, menyemak catatan, atau mengedit status.
        </p>
      </div>

      {/* Main Calendar View */}
      <div className="grid lg:grid-cols-1 gap-6 items-start">
        <PlannerCalendar bookings={bookings} onDateClick={(date) => setSelectedDate(date)} />
      </div>

      {/* Date detail - Modal / Drawer */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 my-auto border-2 border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{format(selectedDate, "dd MMMM yyyy")}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{homestayName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* External Sync Banner if synced */}
              {(() => {
                const dateKey = format(selectedDate, "yyyy-MM-dd");
                const currentEntry = bookings[dateKey];
                const isSynced = Boolean(currentEntry?.booked && (currentEntry?.syncedNote || currentEntry?.source === "airbnb" || currentEntry?.source === "booking" || currentEntry?.source === "ical"));
                if (!isSynced) return null;

                const platform = currentEntry?.source?.includes("airbnb") 
                  ? "Airbnb" 
                  : currentEntry?.source?.includes("booking") 
                  ? "Booking.com" 
                  : "Kalendar Luar";
                const note = currentEntry?.syncedNote || (currentEntry?.source?.includes("airbnb") ? "Airbnb: Tempahan Luar" : "Disegerakkan dari kalendar luar");

                return (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5 text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                          Disinkronkan: {platform}
                        </span>
                        <span className="text-[9px] bg-amber-200/80 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          Auto-Sync
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">
                        {note}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Primary Booking Checkbox Card */}
              <div 
                onClick={() => {
                  if (editBooked) {
                    setEditBooked(false);
                    setEditSource("");
                    setEditPrice("");
                  } else {
                    setEditBooked(true);
                    if (!editSource) setEditSource("direct");
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer select-none",
                  editBooked 
                    ? "bg-emerald-50/90 border-emerald-500 shadow-sm shadow-emerald-100/50 ring-2 ring-emerald-400/20" 
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editBooked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditBooked(checked);
                      if (!checked) {
                        setEditSource("");
                        setEditPrice("");
                      } else if (!editSource) {
                        setEditSource("direct");
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <span>Status:</span>
                      {editBooked ? (
                        <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                          ✓ Ditempah (Booked)
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          ○ Kosong (Available)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                      {editBooked 
                        ? "Tarikh ini bertanda DITEMPAH." 
                        : "Tandakan untuk jadikan DITEMPAH."}
                    </p>
                  </div>
                </div>
                {editBooked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditBooked(false);
                      setEditSource("");
                      setEditPrice("");
                    }}
                    disabled={saving}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider underline cursor-pointer px-1 py-0.5"
                  >
                    Batal
                  </button>
                )}
              </div>

              {/* 3 Booking Channel Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Saluran Tempahan
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {editBooked ? `Aktif: ${editSource || "Direct"}` : "Pilih saluran"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditBooked(true);
                      setEditSource("direct");
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer",
                      editBooked && editSource === "direct"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
                    )}
                  >
                    <span className="text-xs font-black">Direct</span>
                    <span className="text-[9px] text-slate-400">WhatsApp/Call</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditBooked(true);
                      setEditSource("booking");
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer",
                      editBooked && editSource === "booking"
                        ? "bg-sky-50 border-sky-500 text-sky-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                    )}
                  >
                    <span className="text-xs font-black">Booking.com</span>
                    <span className="text-[9px] text-slate-400">OTA</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditBooked(true);
                      setEditSource("airbnb");
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer",
                      editBooked && editSource === "airbnb"
                        ? "bg-rose-50 border-rose-500 text-rose-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
                    )}
                  >
                    <span className="text-xs font-black">Airbnb</span>
                    <span className="text-[9px] text-slate-400">OTA</span>
                  </button>
                </div>
              </div>

              {/* Harga / Income (RM) */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Harga Sewaan (RM)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 font-black text-slate-400 text-xs pointer-events-none">
                    RM
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    disabled={saving || !editBooked}
                    placeholder="Contoh: 180"
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Comment Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Catatan / Nama Pelanggan</span>
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  disabled={saving}
                  placeholder="Contoh: En. Razak check-in 3 petang..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Resit / Lampiran</span>
                </label>

                <div className="space-y-1.5">
                  {editAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold text-slate-700">{getAttachmentName(file)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={getAttachmentUrl(file)} target="_blank" rel="noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button type="button" onClick={() => removeAttachment(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer text-xs font-bold text-slate-500 hover:text-blue-600 transition">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading || saving} />
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? "Memuat naik..." : "Muat Naik Fail / Resit"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                disabled={saving}
                onClick={resetDate}
                className="py-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                disabled={saving}
                onClick={() => saveChanges()}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengurusan iCal Feed */}
      {showIcalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5 my-auto border-2 border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Pautan Kalendar (iCal)</h3>
                  <p className="text-xs text-slate-400 font-semibold">{homestayName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowIcalModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pautan Disambung ({icalFeeds.length})</h4>
              {icalFeeds.length === 0 ? (
                <div className="p-5 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-slate-500">Belum ada pautan kalendar ditambah.</p>
                  <p className="text-[11px] text-slate-400">Tambah pautan Airbnb atau Booking.com di bawah.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {icalFeeds.map((feed) => (
                    <div key={feed.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800">{feed.name}</span>
                          {feed.status === "ok" ? (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                              OK
                            </span>
                          ) : feed.status === "error" ? (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                              Ralat
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{feed.url}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleAddFeed} className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Tambah Pautan Baru</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <select
                    value={newFeedName}
                    onChange={(e) => setNewFeedName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="Airbnb">Airbnb</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="url"
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingIcalConfig || !newFeedUrl.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
              >
                {savingIcalConfig ? "Menyimpan..." : "Tambah & Sync"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
