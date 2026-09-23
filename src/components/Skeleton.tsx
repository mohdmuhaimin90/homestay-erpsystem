import React from 'react';

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-lg ${className}`}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-4 w-28" />
        <SkeletonPulse className="h-9 w-9 rounded-xl" />
      </div>
      <SkeletonPulse className="h-8 w-36 mb-2" />
      <SkeletonPulse className="h-3 w-48" />
    </div>
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6">
        <SkeletonPulse className="h-6 w-40" />
        <SkeletonPulse className="h-9 w-64" />
      </div>
      <div className="space-y-4">
        {/* Table Header */}
        <div className="grid gap-4 py-3 border-b border-slate-100 dark:border-slate-800" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonPulse key={`th-${i}`} className="h-4 w-3/4" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="grid gap-4 py-3 border-b border-slate-50 dark:border-slate-800/50" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonPulse key={`td-${r}-${c}`} className={`h-4 ${c === 0 ? 'w-5/6' : c === 1 ? 'w-2/3' : 'w-1/2'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-8 w-48" />
        <div className="flex space-x-2">
          <SkeletonPulse className="h-9 w-24 rounded-lg" />
          <SkeletonPulse className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonPulse key={`cal-h-${i}`} className="h-6 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonPulse key={`cal-c-${i}`} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
