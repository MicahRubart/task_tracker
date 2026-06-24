/**
 * Normalizes a UTC-midnight date (as stored in the DB) to the equivalent
 * local calendar date, avoiding the off-by-one day shift in negative-offset
 * timezones (US timezones are UTC-4 to UTC-8).
 */
function toCalendarDate(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function localToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type DueUrgency =
  | "overdue"
  | "tomorrow"
  | "two-days"
  | "four-days"
  | "week"
  | "none";

export function getDueUrgency(
  dueDate: Date | null | undefined,
  isComplete: boolean
): DueUrgency {
  if (!dueDate || isComplete) return "none";

  const today = localToday();
  const due = toCalendarDate(dueDate);
  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (daysUntil < 0)  return "overdue";
  if (daysUntil <= 1) return "tomorrow";
  if (daysUntil <= 2) return "two-days";
  if (daysUntil <= 4) return "four-days";
  if (daysUntil <= 7) return "week";
  return "none";
}

/**
 * Returns the exact day-count label shown under the due date.
 * Always shows a real number — no "This week" buckets.
 */
export function getDaysUntilLabel(
  dueDate: Date | null | undefined,
  isComplete: boolean
): string {
  if (!dueDate || isComplete) return "";

  const today = localToday();
  const due = toCalendarDate(dueDate);
  const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (daysUntil < 0)   return "Overdue";
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days`;
}

export const URGENCY_CELL: Record<DueUrgency, { bg: string; text: string }> = {
  overdue:    { bg: "bg-red-100",    text: "text-red-700 font-semibold"    },
  tomorrow:   { bg: "bg-red-50",     text: "text-red-600 font-semibold"    },
  "two-days": { bg: "bg-orange-100", text: "text-orange-700 font-semibold" },
  "four-days":{ bg: "bg-yellow-100", text: "text-yellow-700 font-semibold" },
  week:       { bg: "bg-yellow-50",  text: "text-yellow-600"               },
  none:       { bg: "",              text: "text-gray-600"                  },
};

export type StuckCountdown =
  | { days: number; overdue: false }
  | { days: number; overdue: true }
  | null;

export function getStuckCountdown(
  stuckDeadline: Date | null | undefined,
  status: string
): StuckCountdown {
  if (status !== "STUCK" || !stuckDeadline) return null;
  const today = localToday();
  const deadline = toCalendarDate(stuckDeadline);
  const days = Math.round((deadline.getTime() - today.getTime()) / 86400000);
  return days < 0
    ? { days: Math.abs(days), overdue: true }
    : { days, overdue: false };
}

/** Formats a date-only value — uses UTC to match the stored date exactly */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a full datetime (notes, audit trail) — uses local time */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  return toCalendarDate(dueDate) < localToday();
}

export function isDueThisWeek(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  const today = localToday();
  const in7 = new Date(today);
  in7.setDate(today.getDate() + 7);
  const due = toCalendarDate(dueDate);
  return due >= today && due <= in7;
}
