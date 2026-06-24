export function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(dueDate) < now;
}

export function isDueThisWeek(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const d = new Date(dueDate);
  return d >= startOfWeek && d <= endOfWeek;
}

export type DueUrgency =
  | "overdue"
  | "tomorrow"   // 1 day
  | "two-days"   // 2 days
  | "four-days"  // 3–4 days
  | "week"       // 5–7 days
  | "none";

/** Returns how urgent a due date is. Returns "none" if no date or task is complete. */
export function getDueUrgency(
  dueDate: Date | null | undefined,
  isComplete: boolean
): DueUrgency {
  if (!dueDate || isComplete) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const daysUntil = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "tomorrow";   // due today = treat as tomorrow
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil <= 2)  return "two-days";
  if (daysUntil <= 4)  return "four-days";
  if (daysUntil <= 7)  return "week";
  return "none";
}

/** Tailwind classes for the due date cell based on urgency */
export const URGENCY_CELL: Record<DueUrgency, { bg: string; text: string; label: string }> = {
  overdue:    { bg: "bg-red-100",    text: "text-red-700 font-semibold",    label: "Overdue"   },
  tomorrow:   { bg: "bg-red-50",     text: "text-red-600 font-semibold",    label: "Tomorrow"  },
  "two-days": { bg: "bg-orange-100", text: "text-orange-700 font-semibold", label: "2 days"    },
  "four-days":{ bg: "bg-yellow-100", text: "text-yellow-700 font-semibold", label: "4 days"    },
  week:       { bg: "bg-yellow-50",  text: "text-yellow-600",               label: "This week" },
  none:       { bg: "",              text: "text-gray-600",                  label: ""          },
};

export type StuckCountdown =
  | { days: number; overdue: false }
  | { days: number; overdue: true }
  | null;

/** Returns days remaining until stuck deadline, or null if not applicable */
export function getStuckCountdown(
  stuckDeadline: Date | null | undefined,
  status: string
): StuckCountdown {
  if (status !== "STUCK" || !stuckDeadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(stuckDeadline); deadline.setHours(0, 0, 0, 0);
  const days = Math.round((deadline.getTime() - today.getTime()) / 86400000);
  return days < 0
    ? { days: Math.abs(days), overdue: true }
    : { days, overdue: false };
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
