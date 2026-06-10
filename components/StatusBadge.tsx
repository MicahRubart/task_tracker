"use client";

import { TaskStatus } from "@/app/generated/prisma/client";

const config: Record<TaskStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  BLOCKED: { label: "Blocked", className: "bg-orange-100 text-orange-700" },
  COMPLETE: { label: "Complete", className: "bg-green-100 text-green-700" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

