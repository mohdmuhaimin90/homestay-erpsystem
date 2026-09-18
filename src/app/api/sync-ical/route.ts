import { NextRequest, NextResponse } from "next/server";
import { getProperties, getBookings, saveGuest, saveBooking } from "@/lib/supabase";
import { BookingSource } from "@/lib/types";

// Simple robust pure-JS iCal parser
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

export async function POST(request: NextRequest) {
  try {
    const properties = await getProperties();
    const existingBookings = await getBookings();
    let totalImported = 0;
    const logs: string[] = [];

    for (const prop of properties) {
      const syncSources: Array<{ url?: string; source: BookingSource; label: string }> = [
        { url: prop.airbnb_ical_url, source: "airbnb", label: "Airbnb" },
        { url: prop.bookingcom_ical_url, source: "booking_com", label: "Booking.com" },
      ];

      for (const src of syncSources) {
        if (!src.url || !src.url.startsWith("http")) continue;

        try {
          const res = await fetch(src.url, { next: { revalidate: 0 } });
          if (!res.ok) {
            logs.push(`Gagal ambil iCal untuk ${prop.name} (${src.label}) - Status ${res.status}`);
            continue;
          }
          const icsText = await res.text();
          const events = parseICalEvents(icsText);

          for (const ev of events) {
            // Check if already exists by UID or matching property & dates
            const alreadyExists = existingBookings.some(
              (b) =>
                (b.ical_uid && b.ical_uid === ev.uid) ||
                (b.property_id === prop.id && b.check_in === ev.start && b.check_out === ev.end)
            );

            if (!alreadyExists) {
              // Create guest entry
              const guest = await saveGuest({
                name: `${src.label} Guest (${ev.summary})`,
                phone: "-",
                notes: `Auto-synced from ${src.label} iCal Feed`,
              });

              // Calculate nights
              const d1 = new Date(ev.start);
              const d2 = new Date(ev.end);
              const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
              const price = (nights * prop.base_price_per_night) + (prop.cleaning_fee || 0);

              // Create booking
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

              totalImported++;
              logs.push(`Diselaraskan: ${prop.name} (${ev.start} -> ${ev.end}) dari ${src.label}`);
            }
          }
        } catch (fetchErr: any) {
          logs.push(`Ralat memproses ${prop.name} (${src.label}): ${fetchErr.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: totalImported,
      logs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
