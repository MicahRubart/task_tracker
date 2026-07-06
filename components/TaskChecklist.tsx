"use client";

import { useState, useRef } from "react";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
} from "@/app/actions/checklist";
import { formatDate } from "@/lib/utils";
import type { ChecklistItem } from "@/app/generated/prisma/client";

interface Props {
  taskId: string;
  items: ChecklistItem[];
  currentEmployeeId: string;
}

export function TaskChecklist({ taskId, items, currentEmployeeId }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const completed = items.filter((i) => i.completedAt);
  const pending = items.filter((i) => !i.completedAt);
  const progress = items.length === 0 ? 0 : Math.round((completed.length / items.length) * 100);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    await addChecklistItem({ taskId, title: newTitle.trim(), dueDate: newDueDate || undefined });
    setNewTitle("");
    setNewDueDate("");
    setSubmitting(false);
    setAdding(false);
  }

  async function handleToggle(item: ChecklistItem) {
    await toggleChecklistItem(item.id, !item.completedAt);
  }

  async function handleDelete(itemId: string) {
    await deleteChecklistItem(itemId);
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDue(item.dueDate ? item.dueDate.toISOString().slice(0, 10) : "");
  }

  async function handleEditSave(itemId: string) {
    if (!editTitle.trim()) { setEditingId(null); return; }
    await updateChecklistItem(itemId, {
      title: editTitle.trim(),
      dueDate: editDue || null,
    });
    setEditingId(null);
  }

  function dueDateColor(dueDate: Date | null): string {
    if (!dueDate) return "text-gray-400";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setUTCHours(0, 0, 0, 0);
    if (due < today) return "text-red-500 font-semibold";
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff <= 2) return "text-orange-500 font-semibold";
    return "text-gray-400";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Checklist
          {items.length > 0 && (
            <span className="ml-2 font-normal normal-case text-gray-400">
              {completed.length}/{items.length}
            </span>
          )}
        </h4>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Pending items */}
      {items.length === 0 && !adding && (
        <p className="text-xs text-gray-400 italic mb-2">No checklist items yet.</p>
      )}

      <div className="space-y-1">
        {[...pending, ...completed].map((item) => (
          <div
            key={item.id}
            className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white ${
              item.completedAt ? "opacity-60" : ""
            }`}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => handleToggle(item)}
              className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                item.completedAt
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              {item.completedAt && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Title / edit inline */}
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="space-y-1">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditSave(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full border-b border-indigo-400 bg-transparent focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => handleEditSave(item.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${item.completedAt ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.title}
                  </span>
                  {item.dueDate && (
                    <span className={`text-xs ${dueDateColor(item.dueDate)}`}>
                      {formatDate(item.dueDate)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Edit / delete — hover only */}
            {editingId !== item.id && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => startEdit(item)}
                  className="p-0.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                  title="Edit"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add item form */}
      {adding && (
        <form onSubmit={handleAdd} className="mt-2 space-y-2 bg-white border border-indigo-200 rounded-lg p-3">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Checklist item..."
            required
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">Due date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => { setAdding(false); setNewTitle(""); setNewDueDate(""); }}
                className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newTitle.trim()}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 font-medium"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
