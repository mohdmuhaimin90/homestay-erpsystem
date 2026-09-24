export type HomestayKey = 'kemaman-1' | 'kemaman-2' | 'gong-badak';

export interface PlannerBookingEntry {
  booked: boolean;
  comment: string;
  attachments?: string[];
  source?: 'direct' | 'booking' | 'airbnb' | 'manual' | 'ical' | string;
  syncedNote?: string;
  price?: number | null;
}

export interface IcalFeed {
  id: string;
  name: string;
  url: string;
  lastSynced?: string;
  status?: 'ok' | 'error';
  errorMessage?: string;
  syncedCount?: number;
}

export interface PlannerData {
  'kemaman-1': { [date: string]: PlannerBookingEntry };
  'kemaman-2': { [date: string]: PlannerBookingEntry };
  'gong-badak': { [date: string]: PlannerBookingEntry };
}
