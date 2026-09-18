import { createClient } from "@supabase/supabase-js";
import { Property, Guest, Booking } from "./types";
import { mockProperties, mockGuests, mockBookings } from "./mockData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper data fetching with fallback to mock data / localStorage
export async function getProperties(): Promise<Property[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("properties").select("*").order("name");
    if (!error && data && data.length > 0) return data;
  }
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_properties");
    if (local) return JSON.parse(local);
  }
  return mockProperties;
}

export async function getGuests(): Promise<Guest[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("guests").select("*").order("name");
    if (!error && data && data.length > 0) return data;
  }
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_guests");
    if (local) return JSON.parse(local);
  }
  return mockGuests;
}

export async function getBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, property:properties(*), guest:guests(*)")
      .order("check_in", { ascending: false });
    if (!error && data && data.length > 0) return data;
  }
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_bookings");
    if (local) return JSON.parse(local);
  }
  return mockBookings;
}

export async function saveBooking(booking: Omit<Booking, "id"> & { id?: string }): Promise<Booking> {
  const newBookingId = booking.id || "bk-" + Date.now();
  const completeBooking: Booking = {
    ...booking,
    id: newBookingId,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { property, guest, ...dbPayload } = booking as any;
    const { data, error } = await supabase.from("bookings").insert([dbPayload]).select("*, property:properties(*), guest:guests(*)").single();
    if (!error && data) return data;
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    const current = await getBookings();
    const updated = [completeBooking, ...current.filter((b) => b.id !== newBookingId)];
    localStorage.setItem("homestay_bookings", JSON.stringify(updated));
  }
  return completeBooking;
}

export async function saveProperty(property: Omit<Property, "id"> & { id?: string }): Promise<Property> {
  const newId = property.id || "prop-" + Date.now();
  const complete: Property = { ...property, id: newId };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("properties").insert([property]).select().single();
    if (!error && data) return data;
  }

  if (typeof window !== "undefined") {
    const current = await getProperties();
    const updated = [complete, ...current.filter((p) => p.id !== newId)];
    localStorage.setItem("homestay_properties", JSON.stringify(updated));
  }
  return complete;
}

export async function saveGuest(guest: Omit<Guest, "id"> & { id?: string }): Promise<Guest> {
  const newId = guest.id || "gst-" + Date.now();
  const complete: Guest = { ...guest, id: newId };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("guests").insert([guest]).select().single();
    if (!error && data) return data;
  }

  if (typeof window !== "undefined") {
    const current = await getGuests();
    const updated = [complete, ...current.filter((g) => g.id !== newId)];
    localStorage.setItem("homestay_guests", JSON.stringify(updated));
  }
  return complete;
}
