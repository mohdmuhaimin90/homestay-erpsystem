import { NextRequest, NextResponse } from "next/server";
import { getBookings, getProperties, saveBooking, saveGuest, supabase, isSupabaseConfigured, invalidateCache } from "@/lib/supabase";
import { Booking, BookingSource } from "@/lib/types";
import { HomestayKey, PlannerBookingEntry, PlannerData } from "@/lib/plannerTypes";
import { addDays, format, parseISO } from "date-fns";

function normalizePropertyKey(propIdOrName: string): HomestayKey | null {
  const lower = propIdOrName.toLowerCase();
  if (lower.includes("kemaman-1") || lower.includes("kemaman 1")) return "kemaman-1";
  if (lower.includes("kemaman-2") || lower.includes("kemaman 2")) return "kemaman-2";
  if (lower.includes("gong-badak") || lower.includes("gong badak")) return "gong-badak";
  return null;
}

export async function GET() {
  try {
    const [bookings, properties] = await Promise.all([getBookings(), getProperties()]);

    const result: PlannerData = {
      "kemaman-1": {},
      "kemaman-2": {},
      "gong-badak": {},
    };

    for (const b of bookings) {
      if (b.booking_status === "cancelled") continue;

      const propKey = normalizePropertyKey(b.property_id || "") ||
        (b.property?.name ? normalizePropertyKey(b.property.name) : null);

      if (!propKey) continue;

      const checkInDate = parseISO(b.check_in);
      const checkOutDate = parseISO(b.check_out);
      const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyPrice = nights > 0 ? Math.round(Number(b.total_price || 0) / nights) : Number(b.total_price || 0);

      let cleanSource = "direct";
      if (b.source === "airbnb") cleanSource = "airbnb";
      else if (b.source === "booking_com") cleanSource = "booking";

      // Fill dates
      for (let i = 0; i < nights; i++) {
        const currentDate = addDays(checkInDate, i);
        const dateStr = format(currentDate, "yyyy-MM-dd");

        let cleanComment = b.notes || "";
        if (cleanComment.startsWith("Booking Planner: ")) {
          cleanComment = cleanComment.replace("Booking Planner: ", "").replace(/\s*\(\d+\s*malam\)$/i, "");
        } else if (!cleanComment && b.guest?.name && !b.guest.name.includes("Pelanggan Booking Planner")) {
          cleanComment = b.guest.name;
        }

        result[propKey][dateStr] = {
          booked: true,
          comment: cleanComment,
          price: dailyPrice > 0 ? dailyPrice : null,
          source: cleanSource,
          syncedNote: b.ical_uid ? (b.notes || "Disegerakkan dari kalendar luar") : undefined,
          attachments: [],
        };
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/planner/bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { homestay, date, booked, comment, attachments, source, price } = body;

    if (!homestay || !date) {
      return NextResponse.json({ error: "Missing required fields: homestay, date" }, { status: 400 });
    }

    const properties = await getProperties();
    const matchedProp = properties.find((p) => normalizePropertyKey(p.id) === homestay || normalizePropertyKey(p.name) === homestay);
    const propId = matchedProp ? matchedProp.id : homestay;

    const nextDayStr = format(addDays(parseISO(date), 1), "yyyy-MM-dd");

    if (!booked) {
      // Unbook / Cancel / Delete
      if (isSupabaseConfigured && supabase) {
        // Delete booking covering this date
        await supabase
          .from("bookings")
          .delete()
          .eq("property_id", propId)
          .eq("check_in", date);
      }
      invalidateCache("bookings");
    } else {
      // Book / Save
      let bookingSource: BookingSource = "direct_whatsapp";
      if (source === "airbnb") bookingSource = "airbnb";
      else if (source === "booking") bookingSource = "booking_com";

      const guestName = (comment && comment.trim()) || `Pelanggan Direct (${format(parseISO(date), "dd MMM")})`;
      const guest = await saveGuest({
        name: guestName,
        phone: "-",
        notes: `Ditempah melalui Mod Parents Planner`,
      });

      const numericPrice = (price !== undefined && price !== null && !isNaN(Number(price))) ? Number(price) : (matchedProp?.base_price_per_night || 0);

      await saveBooking({
        property_id: propId,
        guest_id: guest.id,
        check_in: date,
        check_out: nextDayStr,
        total_nights: 1,
        total_price: numericPrice,
        deposit_amount: matchedProp?.deposit_amount || 0,
        source: bookingSource,
        booking_status: "confirmed",
        payment_status: numericPrice > 0 ? "fully_paid" : "unpaid",
        notes: comment ? `Booking Planner: ${comment.trim()}` : undefined,
      });
      invalidateCache("bookings");
    }

    // Return authoritative updated bookings
    const updatedResponse = await GET();
    const updatedData = await updatedResponse.json();
    const homestayBookings = updatedData[homestay] || {};

    return NextResponse.json({ success: true, bookings: homestayBookings });
  } catch (error: any) {
    console.error("POST /api/planner/bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
