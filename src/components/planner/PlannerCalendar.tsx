"use client";

import React, { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, MessageSquare, Paperclip } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlannerBookingEntry } from "@/lib/plannerTypes";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PlannerCalendarProps {
  bookings: { [date: string]: PlannerBookingEntry };
  onDateClick?: (date: Date) => void;
}

export default function PlannerCalendar({ bookings, onDateClick }: PlannerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayData = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return bookings[key];
  };

  const daysOfWeek = ["Ahad", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

  // Calculate total price/income for current displayed month
  const totalMonthIncome = calendarDays.reduce((sum, day) => {
    if (!isSameMonth(day, monthStart)) return sum;
    const dayData = getDayData(day);
    if (dayData?.booked && typeof dayData.price === "number" && !isNaN(dayData.price) && dayData.price > 0) {
      return sum + dayData.price;
    }
    return sum;
  }, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 bg-white border-b border-slate-100">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-600"
          title="Bulan sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-black text-slate-900 text-lg uppercase tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          {totalMonthIncome > 0 && (
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-xs">
              Hasil: RM {totalMonthIncome.toLocaleString("ms-MY")}
            </span>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-600"
          title="Bulan seterusnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayData = getDayData(day);
          const booked = dayData?.booked;
          const hasComment = Boolean(dayData?.comment && dayData.comment.trim().length > 0);
          const hasAttachments = Boolean(dayData?.attachments && dayData.attachments.length > 0);
          const isAutoSynced = Boolean(booked && (dayData?.syncedNote || dayData?.comment?.includes("Synced")));

          const isAirbnb = Boolean(dayData?.source?.includes("airbnb") || dayData?.syncedNote?.toLowerCase().includes("airbnb"));
          const isBooking = Boolean(dayData?.source?.includes("booking") || dayData?.syncedNote?.toLowerCase().includes("booking"));
          const isDirect = Boolean(booked && (dayData?.source === "direct" || dayData?.source === "manual" || (!isAirbnb && !isBooking)));

          const current = isSameMonth(day, monthStart);
          const today = isToday(day);

          let cellBg = "bg-white hover:bg-slate-50";
          let dateTextColor = current ? "text-slate-800" : "text-slate-200";

          if (current && booked) {
            if (isAirbnb) {
              cellBg = "bg-rose-50/90 hover:bg-rose-100/90";
              dateTextColor = "text-rose-700";
            } else if (isBooking) {
              cellBg = "bg-sky-50/90 hover:bg-sky-100/90";
              dateTextColor = "text-sky-800";
            } else {
              cellBg = "bg-emerald-50/90 hover:bg-emerald-100/90";
              dateTextColor = "text-emerald-800";
            }
          }

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center relative border-b border-r border-slate-100 transition-all",
                !current && "text-slate-200 bg-slate-50/30",
                cellBg,
                "cursor-pointer"
              )}
            >
              <span className={cn(
                "text-sm font-bold z-10",
                dateTextColor,
                today && current && "ring-2 ring-blue-500 ring-offset-2 rounded-full w-7 h-7 flex items-center justify-center bg-blue-600 text-white shadow-sm"
              )}>
                {format(day, "d")}
              </span>

              {booked && current && dayData?.price != null && dayData.price > 0 && (
                <span className="text-[9px] font-black text-slate-800 bg-white/90 border border-slate-200/80 px-1 py-0.2 rounded mt-0.5 shadow-xs z-10 leading-none">
                  RM{dayData.price}
                </span>
              )}
              
              {booked && current && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  {isAirbnb && (
                    <span className="text-[7.5px] font-black text-rose-700 bg-rose-100/80 px-1 py-0.2 rounded uppercase tracking-tight">
                      Airbnb
                    </span>
                  )}
                  {isBooking && (
                    <span className="text-[7.5px] font-black text-sky-800 bg-sky-100/80 px-1 py-0.2 rounded uppercase tracking-tight">
                      Booking
                    </span>
                  )}
                  {isDirect && (
                    <span className="text-[7.5px] font-black text-emerald-800 bg-emerald-100/80 px-1 py-0.2 rounded uppercase tracking-tight">
                      Direct
                    </span>
                  )}
                </div>
              )}

              {current && (isAutoSynced || hasComment || hasAttachments) && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {isAutoSynced && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title={`Auto-sync: ${dayData?.syncedNote || "Kalendar Luar"}`} />
                  )}
                  {hasAttachments && (
                    <span title="Ada lampiran fail">
                      <Paperclip className="w-2.5 h-2.5 text-indigo-600" />
                    </span>
                  )}
                  {hasComment && (
                    <span title="Ada catatan">
                      <MessageSquare className="w-2.5 h-2.5 text-blue-500 fill-blue-500/20" />
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-100 border border-emerald-400 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Direct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-sky-100 border border-sky-400 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Booking.com</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-100 border border-rose-400 rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Airbnb</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white border border-slate-300 rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kosong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auto-Sync</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan</span>
        </div>
      </div>
    </div>
  );
}
