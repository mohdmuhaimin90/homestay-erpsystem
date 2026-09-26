import { NextRequest, NextResponse } from "next/server";
import { getProperties, saveProperty } from "@/lib/supabase";
import { IcalFeed } from "@/lib/plannerTypes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ homestayId: string }> }
) {
  try {
    const { homestayId } = await params;
    const properties = await getProperties();
    const prop = properties.find((p) => p.id === homestayId || p.id.includes(homestayId));

    const feeds: IcalFeed[] = [];
    if (prop?.airbnb_ical_url) {
      feeds.push({
        id: "airbnb",
        name: "Airbnb",
        url: prop.airbnb_ical_url,
        status: "ok",
      });
    }
    if (prop?.bookingcom_ical_url) {
      feeds.push({
        id: "bookingcom",
        name: "Booking.com",
        url: prop.bookingcom_ical_url,
        status: "ok",
      });
    }

    return NextResponse.json({ feeds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ homestayId: string }> }
) {
  try {
    const { homestayId } = await params;
    const body = await req.json();
    const feeds: IcalFeed[] = body.feeds || [];

    const properties = await getProperties();
    const prop = properties.find((p) => p.id === homestayId || p.id.includes(homestayId));

    if (prop) {
      let airbnbUrl = "";
      let bookingcomUrl = "";

      for (const feed of feeds) {
        if (feed.name.toLowerCase().includes("airbnb") || feed.url.includes("airbnb")) {
          airbnbUrl = feed.url;
        } else {
          bookingcomUrl = feed.url;
        }
      }

      await saveProperty({
        ...prop,
        airbnb_ical_url: airbnbUrl || undefined,
        bookingcom_ical_url: bookingcomUrl || undefined,
      });
    }

    return NextResponse.json({ success: true, feeds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
