import { NextRequest, NextResponse } from "next/server";
import { getProperties, getBookings, saveGuest, saveBooking } from "@/lib/supabase";
import { BookingSource } from "@/lib/types";

function parseICalEvents(icsData: string) {
  const events: Array<{ uid: string; start: string; end: string; summary: string }> = [];
  const lines = icsData.split(/\r\n|\n|\r/);

  let inEvent = false;
  let currentEvent: any = {};

  for (let line of lines) {
    line = line.trim();
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {};
    } else if (line === "END:VEVENT") {
      if (currentEvent.start && currentEvent.end) {
        events.push({
          uid: currentEvent.uid || `event-${Date.now()}-${Math.random()}`,
          start: currentEvent.start,
          end: currentEvent.end,
          summary: currentEvent.summary || "Booked (External)",
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith("DTSTART")) {
        const val = line.split(":")[1];
        if (val) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentEvent.start = `${y}-${m}-${d}`;
        }
      } else if (line.startsWith("DTEND")) {
        const val = line.split(":")[1];
        if (val) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentEvent.end = `${y}-${m}-${d}`;
        }
      } else if (line.startsWith("SUMMARY:")) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith("UID:")) {
        currentEvent.uid = line.substring(4);
      }
    }
  }
  return events;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ homestayId: string }> }
) {
  try {
    const { homestayId } = await params;
    const properties = await getProperties();
    const prop = properties.find((p) => p.id === homestayId || p.id.includes(homestayId));

    if (!prop) {
      return NextResponse.json({ error: "Homestay tidak dijumpai" }, { status: 404 });
    }

    const existingBookings = await getBookings();
    let totalImported = 0;

    const feeds: Array<{ url?: string; source: BookingSource; label: string }> = [
      { url: prop.airbnb_ical_url, source: "airbnb", label: "Airbnb" },
      { url: prop.bookingcom_ical_url, source: "booking_com", label: "Booking.com" },
    ];

    for (const src of feeds) {
      if (!src.url || !src.url.startsWith("http")) continue;

      try {
        const res = await fetch(src.url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;

        const icsText = await res.text();
        const events = parseICalEvents(icsText);

        for (const ev of events) {
          const alreadyExists = existingBookings.some(
            (b) =>
              (b.ical_uid && b.ical_uid === ev.uid) ||
              (b.property_id === prop.id && b.check_in === ev.start && b.check_out === ev.end)
          );

          if (!alreadyExists) {
            const guest = await saveGuest({
              name: `${src.label} Guest (${ev.summary})`,
              phone: "-",
              notes: `Auto-synced from ${src.label} iCal Feed`,
            });

            const d1 = new Date(ev.start);
            const d2 = new Date(ev.end);
            const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
            const price = (nights * prop.base_price_per_night) + (prop.cleaning_fee || 0);

            await saveBooking({
              property_id: prop.id,
              guest_id: guest.id,
              check_in: ev.start,
              check_out: ev.end,
              total_nights: nights,
              total_price: price,
              deposit_amount: 0,
              source: src.source,
              booking_status: "confirmed",
              payment_status: "fully_paid",
              ical_uid: ev.uid,
              notes: `Auto-imported from ${src.label} iCal`,
            });

            totalImported += nights;
          }
        }
      } catch (e) {
        console.error("iCal fetch error for", src.label, e);
      }
    }

    return NextResponse.json({
      success: true,
      syncedTotal: totalImported,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
