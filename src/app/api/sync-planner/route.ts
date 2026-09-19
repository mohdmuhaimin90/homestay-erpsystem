import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, saveGuest, saveBooking, getProperties } from "@/lib/supabase";
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

export async function POST(req: NextRequest) {
  try {
    let data: PlannerData | null = null;

    // Check if client provided raw JSON payload directly
    const body = await req.json().catch(() => null);
    if (body && body.data) {
      data = body.data;
    } else if (body && typeof body === "object" && !body.data && Object.keys(body).length > 0) {
      data = body;
    }

    // If not provided in body, try to fetch from Google AI Studio Booking Planner API
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
              message: "Google AI Studio memerlukan pengesahan Cookie browser. Sila gunakan fungsi 'Tarik Terus dari Browser' atau tampal JSON di skrin integrasi.",
            }, { status: 401 });
          }
        }
      } catch (fetchErr: any) {
        console.error("Fetch planner error:", fetchErr);
      }
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({
        success: false,
        error: "Tiada data tempahan yang sah ditemui.",
      }, { status: 400 });
    }

    const properties = await getProperties();
    let importedCount = 0;
    const processedHomestays: string[] = [];

    // Format and import each homestay's bookings
    for (const [homestayId, dateMap] of Object.entries(data)) {
      processedHomestays.push(homestayId);

      // Match or resolve property
      let matchedProp = properties.find((p) => p.id === homestayId || p.name.toLowerCase().includes(homestayId.toLowerCase()));
      const propId = matchedProp ? matchedProp.id : homestayId;

      for (const [dateStr, entry] of Object.entries(dateMap)) {
        if (!entry || !entry.booked) continue;

        // Parse guest name and phone from comment (e.g. "En. Azman - 0123456789")
        let guestName = "Tetamu Booking Planner";
        let guestPhone = "0123456789";
        const comment = entry.comment || "";

        if (comment.includes("-")) {
          const parts = comment.split("-");
          guestName = parts[0].trim() || guestName;
          guestPhone = parts[1].trim() || guestPhone;
        } else if (comment.trim()) {
          guestName = comment.trim();
        }

        // Map source
        let bookingSource: BookingSource = "direct_whatsapp";
        if (entry.source === "airbnb") bookingSource = "airbnb";
        else if (entry.source === "booking" || entry.source === "booking_com") bookingSource = "booking_com";

        // Save Guest
        const guest = await saveGuest({
          name: guestName,
          phone: guestPhone,
          notes: `Imported from Booking Planner (${homestayId})`,
        });

        // Calculate checkout next day
        const checkInDate = new Date(dateStr);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        const checkOutStr = checkOutDate.toISOString().split("T")[0];

        // Save Booking
        await saveBooking({
          property_id: propId,
          guest_id: guest.id,
          check_in: dateStr,
          check_out: checkOutStr,
          total_nights: 1,
          total_price: Number(entry.price || matchedProp?.price_direct || 250),
          deposit_amount: 100,
          source: bookingSource,
          booking_status: "confirmed",
          payment_status: "deposit_paid",
          notes: `Booking Planner: ${comment}`,
        });

        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      homestays: processedHomestays,
      message: `Berjaya menyelaraskan ${importedCount} rekod tempahan dari Booking Planner.`,
    });
  } catch (err: any) {
    console.error("API /api/sync-planner error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Gagal menyelaraskan data.",
    }, { status: 500 });
  }
}