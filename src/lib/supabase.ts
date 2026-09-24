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

// ======================================================================
// IN-MEMORY SWR QUERY CACHE (Pencegahan Kueri Berulang & Laju Pantas)
// ======================================================================
const CACHE_TTL_MS = 60 * 1000; // 60 saat
const queryCache = new Map<string, { data: any; timestamp: number }>();

export function invalidateCache(keyPrefix?: string) {
  if (keyPrefix) {
    for (const k of queryCache.keys()) {
      if (k.startsWith(keyPrefix)) queryCache.delete(k);
    }
  } else {
    queryCache.clear();
  }
}

// Helper data fetching with fallback to mock data / localStorage
export async function getProperties(): Promise<Property[]> {
  const cacheKey = "properties";
  const cached = queryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let list: Property[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("properties").select("*").order("name");
      if (!error && data && data.length > 0) {
        list = data;
      }
    } catch (e) {
      console.warn("Supabase properties query error:", e);
    }
  }
  if (list.length === 0 && typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_properties");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const filtered = parsed.filter((p: any) => !p.name?.includes("Villa A") && !p.name?.includes("Chalet B") && !p.name?.includes("Homestay C"));
        if (filtered.length > 0) list = filtered;
      } catch (e) {
        // ignore
      }
    }
  }
  if (list.length === 0) {
    list = mockProperties;
  }

  // Enrich with specific business rules for Homestay Kenangan units
  const enriched = list.map((p) => {
    const lowerName = (p.name || "").toLowerCase();
    if (lowerName.includes("kemaman 1") || p.id === "kemaman-1") {
      return {
        ...p,
        name: "Homestay Kenangan Kemaman 1",
        address: "Chukai, Kemaman, Terengganu (Rumah Belakang)",
        rental_type: "monthly" as const,
        monthly_rental_rate: 700,
        total_rooms: 2,
        total_bathrooms: 1,
        total_toilets: 1,
        max_guests: 4,
        deposit_amount: 700,
        cleaning_fee: 0,
        base_price_per_night: 0,
        price_direct: 0,
        price_airbnb: 0,
        price_bookingcom: 0,
        google_maps_url: p.google_maps_url || "https://maps.app.goo.gl/KyBmg1iwgqLiSsha9",
        notes: "Kini dijadikan sewaan bilik bulanan (Room Rental) - RM 700 / bulan. Rumah bahagian belakang.",
      };
    }
    if (lowerName.includes("kemaman 2") || p.id === "kemaman-2") {
      return {
        ...p,
        name: "Homestay Kenangan Kemaman 2",
        address: "Chukai, Kemaman, Terengganu (Rumah Depan)",
        rental_type: "daily" as const,
        base_price_per_night: 180,
        price_direct: 180,
        price_airbnb: 215,
        price_bookingcom: 225,
        total_rooms: 3,
        total_bathrooms: 1,
        total_toilets: 1,
        max_guests: 8,
        deposit_amount: 100,
        cleaning_fee: 40,
        google_maps_url: p.google_maps_url || "https://maps.app.goo.gl/KyBmg1iwgqLiSsha9",
        notes: "Rumah depan (3 bilik, 1 toilet, 1 bathroom). Lokasi & kemudahan sama dengan Kemaman 1.",
      };
    }
    if (lowerName.includes("gong badak") || p.id === "gong-badak") {
      return {
        ...p,
        name: "Homestay Kenangan Gong Badak",
        address: "Gong Badak, Kuala Terengganu, Terengganu",
        rental_type: "daily" as const,
        base_price_per_night: 350,
        price_direct: 350,
        price_airbnb: 395,
        price_bookingcom: 410,
        total_rooms: 4,
        total_bathrooms: 4,
        total_toilets: 4,
        max_guests: 12,
        deposit_amount: 150,
        cleaning_fee: 60,
        google_maps_url: p.google_maps_url || "https://maps.app.goo.gl/SCBDByiRjyYQefny6",
        notes: "Rumah di Gong Badak, Kuala Terengganu (4 bilik, 4 bathroom). Dekat UMT/UNISZA & pantai.",
      };
    }
    return p;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("homestay_properties", JSON.stringify(enriched));
  }
  queryCache.set(cacheKey, { data: enriched, timestamp: Date.now() });

  return enriched;
}

export async function getGuests(): Promise<Guest[]> {
  const cacheKey = "guests";
  const cached = queryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let result: Guest[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("guests").select("*").order("name");
      if (!error && data && data.length > 0) result = data;
    } catch (e) {
      console.warn("Supabase guests query error:", e);
    }
  }
  if (result.length === 0 && typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_guests");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          result = parsed;
        }
      } catch (e) {}
    }
  }
  if (result.length === 0) {
    result = mockGuests;
    if (typeof window !== "undefined") {
      localStorage.setItem("homestay_guests", JSON.stringify(mockGuests));
    }
  }

  queryCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}

export async function getBookings(): Promise<Booking[]> {
  const cacheKey = "bookings";
  const cached = queryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let result: Booking[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, property:properties(*), guest:guests(*)")
        .order("check_in", { ascending: false });
      if (!error && data && data.length > 0) {
        result = data;
        if (typeof window !== "undefined") {
          localStorage.setItem("homestay_bookings", JSON.stringify(data));
        }
      }
    } catch (e) {
      console.warn("Supabase bookings query error:", e);
    }
  }
  if (result.length === 0 && typeof window !== "undefined") {
    const local = localStorage.getItem("homestay_bookings");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          result = parsed;
        }
      } catch (e) {}
    }
  }
  if (result.length === 0) {
    result = mockBookings;
    if (typeof window !== "undefined") {
      localStorage.setItem("homestay_bookings", JSON.stringify(mockBookings));
    }
  }

  queryCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}

export async function saveBooking(booking: Omit<Booking, "id"> & { id?: string }): Promise<Booking> {
  invalidateCache("bookings");
  const newBookingId = booking.id || "bk-" + Date.now();
  const completeBooking: Booking = {
    ...booking,
    id: newBookingId,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { property, guest, total_nights, ...rawPayload } = booking as any;
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const dbPayload: Record<string, any> = { ...rawPayload };
    if (!isUuid(dbPayload.id || "")) {
      delete dbPayload.id;
    }
    delete dbPayload.total_nights;

    // Check if an existing booking has the same property and date range
    if (dbPayload.property_id && dbPayload.check_in && dbPayload.check_out) {
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", dbPayload.property_id)
        .eq("check_in", dbPayload.check_in)
        .eq("check_out", dbPayload.check_out)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("bookings")
          .update(dbPayload)
          .eq("id", existing.id)
          .select("*, property:properties(*), guest:guests(*)")
          .single();
        if (!error && data) return data;
      }
    }

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
  invalidateCache("properties");
  const newId = property.id || "prop-" + Date.now();
  const complete: Property = { ...property, id: newId };

  if (isSupabaseConfigured && supabase) {
    const allowedColumns = [
      "id", "name", "address", "base_price_per_night", "cleaning_fee", "deposit_amount",
      "total_rooms", "max_guests", "smartlock_code", "wifi_ssid", "wifi_password",
      "waze_url", "google_maps_url", "status", "created_at", "airbnb_ical_url", "bookingcom_ical_url"
    ];
    const dbPayload: Record<string, any> = {};
    for (const key of allowedColumns) {
      if ((property as any)[key] !== undefined) {
        dbPayload[key] = (property as any)[key];
      }
    }
    const { data, error } = await supabase.from("properties").upsert([dbPayload]).select().single();
    if (!error && data) return { ...complete, ...data };
  }

  if (typeof window !== "undefined") {
    const current = await getProperties();
    const updated = [complete, ...current.filter((p) => p.id !== newId)];
    localStorage.setItem("homestay_properties", JSON.stringify(updated));
  }
  return complete;
}

export async function saveGuest(guest: Omit<Guest, "id"> & { id?: string }): Promise<Guest> {
  invalidateCache("guests");
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
