"use client";

import { TaskStatus } from "@/app/generated/prisma/client";

const config: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
  },
  STARTED: {
    label: "Started",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  STUCK: {
    label: "Stuck",
    className: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  ON_TRACK: {
    label: "On Track",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  OFF_TRACK: {
    label: "Off Track",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
  },
  ESCALATED: {
    label: "Escalated",
    className: "bg-rose-600 text-white border border-rose-700",
    dot: "bg-rose-200",
  },
  COMPLETE: {
    label: "Completed",
    className: "bg-violet-100 text-violet-700 border border-violet-200",
    dot: "bg-violet-500",
  },
  COMPLETED_ONGOING: {
    label: "Completed: Ongoing",
    className: "bg-teal-100 text-teal-700 border border-teal-200",
    dot: "bg-teal-500",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className, dot } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
