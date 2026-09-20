import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: true, message: "Local mock only" });
  }

  try {
    // 1. Delete fake bookings where notes do not start with 'Booking Planner:'
    const { data: allBookings, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, property_id, check_in, check_out, total_price, notes");

    if (fetchErr) throw fetchErr;

    const fakeBookings = (allBookings || []).filter(
      (b) => !b.notes || !b.notes.startsWith("Booking Planner:")
    );

    if (fakeBookings.length > 0) {
      await supabase.from("bookings").delete().in("id", fakeBookings.map((b) => b.id));
    }

    // 2. Remove any duplicate bookings
    const seen = new Map<string, string>();
    const duplicateIds: string[] = [];

    const { data: remainingBookings } = await supabase
      .from("bookings")
      .select("id, property_id, check_in, check_out, total_price");

    for (const b of remainingBookings || []) {
      const key = `${b.property_id}_${b.check_in}_${b.check_out}`;
      if (seen.has(key)) {
        duplicateIds.push(b.id);
      } else {
        seen.set(key, b.id);
      }
    }

    if (duplicateIds.length > 0) {
      await supabase.from("bookings").delete().in("id", duplicateIds);
    }

    // 3. Remove orphan guests
    const { data: validBookings } = await supabase.from("bookings").select("guest_id");
    const usedGuestIds = new Set((validBookings || []).map((b) => b.guest_id));
    const { data: allGuests } = await supabase.from("guests").select("id");
    const orphanGuests = (allGuests || []).filter((g) => !usedGuestIds.has(g.id));

    if (orphanGuests.length > 0) {
      await supabase.from("guests").delete().in("id", orphanGuests.map((g) => g.id));
    }

    return NextResponse.json({
      success: true,
      deletedFakeCount: fakeBookings.length,
      deletedDuplicatesCount: duplicateIds.length,
      deletedOrphanGuestsCount: orphanGuests.length,
    });
  } catch (error: any) {
    console.error("Clean data error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
