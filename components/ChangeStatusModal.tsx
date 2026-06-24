"use client";

import { useState } from "react";
import { changeStatus } from "@/app/actions/tasks";
import { TaskStatus } from "@/app/generated/prisma/client";

interface Props {
  taskId: string;
  taskTitle: string;
  currentStatus: TaskStatus;
  currentEmployeeId: string;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "NOT_STARTED", label: "Not Started", color: "border-gray-300 text-gray-600" },
  { value: "STARTED",     label: "Started",     color: "border-blue-300 text-blue-700"    },
  { value: "ON_TRACK",    label: "On Track",    color: "border-emerald-300 text-emerald-700" },
  { value: "OFF_TRACK",   label: "Off Track",   color: "border-orange-300 text-orange-700"   },
  { value: "STUCK",       label: "Stuck",       color: "border-red-300 text-red-700"      },
  { value: "ESCALATED",   label: "Escalated",   color: "border-rose-500 text-rose-700 bg-rose-50" },
  { value: "COMPLETE",    label: "Completed",   color: "border-violet-300 text-violet-700"  },
];

// Default stuck deadline = 5 business days from today
function defaultStuckDeadline(): string {
  const d = new Date();
  let added = 0;
  while (added < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

export function ChangeStatusModal({
  taskId,
  taskTitle,
  currentStatus,
  currentEmployeeId,
  onClose,
}: Props) {
  const [newStatus, setNewStatus] = useState<TaskStatus>(currentStatus);
  const [reason, setReason]       = useState("");
  const [stuckDeadline, setStuckDeadline] = useState(defaultStuckDeadline());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const changed = newStatus !== currentStatus;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) { onClose(); return; }
    if (!reason.trim()) { setError("Please explain why the status is changing."); return; }
    if (!currentEmployeeId) { setError("Please sign in first."); return; }
    if (newStatus === "STUCK" && !stuckDeadline) {
      setError("Please set a deadline for resolving this blocker."); return;
    }

    setSaving(true);
    setError("");
    try {
      await changeStatus(
        taskId,
        currentEmployeeId,
        newStatus,
        reason.trim(),
        newStatus === "STUCK" ? stuckDeadline : null
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  const currentLabel = STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label ?? currentStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-700 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Change Status</h2>
          <p className="text-xs text-indigo-200 mt-0.5 truncate">{taskTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">New Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = newStatus === opt.value;
                const isCurrent = currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewStatus(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-semibold text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : `${opt.color} bg-white hover:bg-gray-50`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      selected ? "bg-indigo-500" : "bg-current opacity-60"
                    }`} />
                    {opt.label}
                    {isCurrent && (
                      <span className="ml-auto text-gray-300 font-normal text-xs">current</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stuck deadline — only when selecting STUCK */}
          {newStatus === "STUCK" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-red-700">Stuck Countdown Deadline</span>
              </div>
              <p className="text-xs text-red-600">
                Set the date by which this task must be out of "Stuck". A countdown will appear on the task.
              </p>
              <input
                type="date"
                value={stuckDeadline}
                onChange={(e) => setStuckDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                required
                className="w-full border border-red-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          )}

          {/* Escalated callout */}
          {newStatus === "ESCALATED" && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-rose-700">
                Escalated tasks are flagged for leadership attention. Make sure your reason clearly describes what needs to be decided or unblocked.
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Reason for change{changed ? <span className="text-red-500 ml-0.5">*</span> : ""}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                newStatus === "STUCK"      ? "What is blocking this task?" :
                newStatus === "ESCALATED"  ? "What decision or action is needed from leadership?" :
                newStatus === "COMPLETE"   ? "Any final notes on completion?" :
                "Why is the status changing?"
              }
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is recorded in the task notes so the team has context.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || (!changed && !reason.trim())}
              className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving..." : changed ? "Confirm Status Change" : "Close"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
