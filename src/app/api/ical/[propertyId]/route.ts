import { NextRequest, NextResponse } from "next/server";
import { getBookings, getProperties } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;
  const [properties, bookings] = await Promise.all([getProperties(), getBookings()]);

  const property = properties.find((p) => p.id === propertyId);
  const propertyName = property?.name || "Homestay Unit";

  const propertyBookings = bookings.filter(
    (b) => b.property_id === propertyId && b.booking_status !== "cancelled"
  );

  const formatIcalDate = (dateStr: string) => {
    return dateStr.replace(/-/g, "");
  };

  const nowIcal = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Homestay ERP//Calendar Sync 1.0//MS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${propertyName} Bookings`,
  ];

  for (const bk of propertyBookings) {
    const dtstart = formatIcalDate(bk.check_in);
    const dtend = formatIcalDate(bk.check_out);
    const uid = bk.ical_uid || `homestay-erp-${bk.id}@homestayerp.local`;
    const summary = `Booked - ${bk.guest?.name || "Guest"} (${bk.source})`;

    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${nowIcal}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Booking ID: ${bk.id} | Status: ${bk.booking_status} | Source: ${bk.source}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  icsContent.push("END:VCALENDAR");

  const icsBody = icsContent.join("\r\n");

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${propertyId}-bookings.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
