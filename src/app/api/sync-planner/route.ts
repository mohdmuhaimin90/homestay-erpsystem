import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, saveGuest, saveBooking, getProperties, saveProperty } from "@/lib/supabase";
import { BookingSource } from "@/lib/types";

const PLANNER_API_URL = "https://ais-pre-fwyyjvsod46ojedyaguepf-355143251389.asia-southeast1.run.app/api/bookings";
const PLANNER_API_KEY = "hermes_homestay_secret_key_2026";

interface PlannerBookingEntry {
  booked: boolean;
  price?: number;
  source?: string;
  comment?: string;
  attachments?: any[];
}

type PlannerData = Record<string, Record<string, PlannerBookingEntry>>;

// Helper to merge consecutive booked days into a single reservation
function mergeConsecutiveBookings(datesMap: Record<string, PlannerBookingEntry>) {
  const sortedDates = Object.keys(datesMap).filter((d) => datesMap[d] && datesMap[d].booked).sort();
  const clusters: Array<{
    checkIn: string;
    lastDate: string;
    nights: number;
    totalPrice: number;
    source: string;
    comment: string;
    dates: string[];
  }> = [];

  let current: typeof clusters[0] | null = null;

  for (const date of sortedDates) {
    const item = datesMap[date];
    const prevDate = current ? new Date(current.lastDate) : null;
    const thisDate = new Date(date);
    const diffDays = prevDate ? Math.round((thisDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    const sameComment = current && (
      (current.comment.trim() && current.comment.trim().toLowerCase() === (item.comment || "").trim().toLowerCase()) ||
      (!current.comment.trim() && !(item.comment || "").trim())
    );

    if (current && diffDays === 1 && sameComment) {
      current.lastDate = date;
      current.nights += 1;
      current.totalPrice += Number(item.price || 0);
      current.dates.push(date);
    } else {
      if (current) clusters.push(current);
      current = {
        checkIn: date,
        lastDate: date,
        nights: 1,
        totalPrice: Number(item.price || 0),
        source: item.source || "direct",
        comment: item.comment || "",
        dates: [date],
      };
    }
  }
  if (current) clusters.push(current);

  return clusters.map((c) => {
    const nextDay = new Date(c.lastDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      checkIn: c.checkIn,
      checkOut: nextDay.toISOString().split("T")[0],
      nights: c.nights,
      totalPrice: c.totalPrice,
      source: c.source,
      comment: c.comment,
      rawDatesCount: c.dates.length,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    let data: PlannerData | null = null;

    // Check if client passed parsed or stringified JSON payload
    const body = await req.json().catch(() => null);
    if (body && body.data) {
      data = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
    } else if (body && typeof body === "object" && Object.keys(body).length > 0) {
      data = body;
    }

    // Attempt direct server fetch if no body provided
    if (!data) {
      try {
        const res = await fetch(PLANNER_API_URL, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": PLANNER_API_KEY,
            "Accept": "application/json",
          },
          cache: "no-store",
        });

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          if (text.includes("<!doctype html>") || text.includes("Cookie check")) {
            return NextResponse.json({
              success: false,
              requiresCookie: true,
              message: "Google AI Studio Cloud Run memerlukan token sesi browser.",
            }, { status: 401 });
          }
        }
      } catch (fetchErr: any) {
        console.error("Direct fetch failed:", fetchErr);
      }
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({
        success: false,
        error: "Tiada format data Booking Planner yang sah diterima.",
      }, { status: 400 });
    }

    const properties = await getProperties();
    let totalNightsImported = 0;
    let totalReservationsImported = 0;
    const homestaySummaries: Record<string, { reservations: number; nights: number }> = {};

    const createdBookings: any[] = [];
    const createdGuests: any[] = [];

    // 1. Process each homestay from the planner
    for (const [homestayId, dateMap] of Object.entries(data)) {
      if (!dateMap || typeof dateMap !== "object") continue;

      // Find or register the property
      const normId = homestayId.toLowerCase().replace(/-/g, " ");
      let matchedProp = properties.find((p) => {
        const normName = p.name.toLowerCase().replace(/-/g, " ");
        return p.id === homestayId || normName.includes(normId) || normId.includes(normName);
      });

      if (!matchedProp) {
        // Auto-create property if not found
        const cleanName = homestayId === "kemaman-1" 
          ? "Homestay Kenangan Kemaman 1" 
          : homestayId === "kemaman-2" 
          ? "Homestay Kenangan Kemaman 2" 
          : homestayId === "gong-badak" 
          ? "Homestay Kenangan Gong Badak"
          : `Homestay ${homestayId}`;

        matchedProp = await saveProperty({
          id: homestayId,
          name: cleanName,
          address: homestayId.includes("kemaman") ? "Chukai, Kemaman, Terengganu" : "Gong Badak, Kuala Terengganu",
          base_price_per_night: homestayId.includes("gong-badak") ? 350 : homestayId.includes("kemaman-2") ? 180 : 0,
          cleaning_fee: 50,
          deposit_amount: 100,
          total_rooms: 3,
          max_guests: 8,
          status: "active",
        });
      }

      const propId = matchedProp.id;
      homestaySummaries[matchedProp.name] = homestaySummaries[matchedProp.name] || { reservations: 0, nights: 0 };

      // Merge consecutive day entries into reservations
      const mergedReservations = mergeConsecutiveBookings(dateMap);

      for (const resv of mergedReservations) {
        const comment = resv.comment || "";
        let guestName = "Pelanggan Booking Planner";
        let guestPhone = "0120000000";

        if (comment.includes("-")) {
          const parts = comment.split("-");
          guestName = parts[0].trim() || guestName;
          guestPhone = parts[1].trim() || guestPhone;
        } else if (comment.trim()) {
          guestName = comment.trim();
        }

        // Map Booking Source
        let bookingSource: BookingSource = "direct_whatsapp";
        const rawSrc = (resv.source || "").toLowerCase();
        if (rawSrc.includes("airbnb")) bookingSource = "airbnb";
        else if (rawSrc.includes("booking")) bookingSource = "booking_com";
        else if (rawSrc.includes("agoda")) bookingSource = "agoda";

        // 2. Save / Upsert Guest
        const guest = await saveGuest({
          name: guestName,
          phone: guestPhone,
          notes: `Tetamu ${matchedProp.name} (Import dari Google AI Studio Planner)`,
        });
        createdGuests.push(guest);

        // 3. Determine pricing: if 0, use nights * property direct price
        const calcPrice = resv.totalPrice > 0 
          ? resv.totalPrice 
          : (resv.nights * (matchedProp.price_direct || matchedProp.base_price_per_night || (homestayId.includes("gong-badak") ? 350 : 180)));

        // 4. Save Booking
        const saved = await saveBooking({
          property_id: propId,
          guest_id: guest.id,
          check_in: resv.checkIn,
          check_out: resv.checkOut,
          total_nights: resv.nights,
          total_price: calcPrice,
          deposit_amount: matchedProp.deposit_amount || 100,
          source: bookingSource,
          booking_status: "confirmed",
          payment_status: "fully_paid",
          notes: `Booking Planner: ${comment} (${resv.nights} malam)`,
          property: matchedProp,
          guest: guest,
        });
        createdBookings.push({
          ...saved,
          property: matchedProp,
          guest: guest,
        });

        totalReservationsImported++;
        totalNightsImported += resv.nights;
        homestaySummaries[matchedProp.name].reservations += 1;
        homestaySummaries[matchedProp.name].nights += resv.nights;
      }
    }

    return NextResponse.json({
      success: true,
      totalReservations: totalReservationsImported,
      totalNights: totalNightsImported,
      homestaySummaries,
      bookings: createdBookings,
      guests: createdGuests,
      message: `Berjaya mengimport ${totalReservationsImported} tempahan (${totalNightsImported} malam) dari Januari hingga sekarang!`,
    });
  } catch (err: any) {
    console.error("API /api/sync-planner error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Gagal memproses data.",
    }, { status: 500 });
  }
}