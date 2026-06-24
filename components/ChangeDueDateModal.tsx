"use client";

import { useRef, useState } from "react";
import { changeDueDate } from "@/app/actions/tasks";
import { formatDate } from "@/lib/utils";

interface Props {
  taskId: string;
  taskTitle: string;
  currentDate: Date | null;
  currentEmployeeId: string;
  onClose: () => void;
}

export function ChangeDueDateModal({
  taskId,
  taskTitle,
  currentDate,
  currentEmployeeId,
  onClose,
}: Props) {
  const [newDate, setNewDate] = useState(
    currentDate ? new Date(currentDate).toISOString().slice(0, 10) : ""
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) { setError("Please select a new due date."); return; }
    if (!reason.trim()) { setError("A reason is required."); return; }
    if (!currentEmployeeId) { setError("Please sign in before changing a due date."); return; }

    setSaving(true);
    setError("");
    try {
      await changeDueDate(taskId, currentEmployeeId, newDate, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-500 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Change Due Date</h2>
          </div>
          <p className="text-xs text-amber-100 mt-1 ml-6">
            This can only be done once. The date will be permanently locked after this change.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Task name */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Task</p>
            <p className="text-sm font-medium text-gray-800">{taskTitle}</p>
          </div>

          {/* Date comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Current Due Date</label>
              <div className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
                {formatDate(currentDate) || "Not set"}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                New Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                autoFocus
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Reason for change <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the due date is being changed..."
              rows={3}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              This reason will be recorded in the task notes for everyone to see.
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
              disabled={saving || !newDate || !reason.trim()}
              className="flex-1 bg-amber-500 text-white rounded-md py-2 text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving..." : "Confirm Date Change"}
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
