"use client";

import { useEffect, useRef, useState } from "react";
import { createTask } from "@/app/actions/tasks";
import { Department } from "@/app/generated/prisma/client";

interface Props {
  department: Department;
  employees: { id: string; name: string }[];
}

export function AddTaskBar({ department, employees }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wpt_employee_id") ?? "";
    setEmployeeId(stored);
    const handler = (e: Event) => setEmployeeId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 50);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !employeeId) return;
    setSubmitting(true);
    await createTask({
      title: title.trim(),
      department,
      employeeId,
      dueDate: dueDate || undefined,
      partnerIds,
    });
    setTitle("");
    setDueDate("");
    setPartnerIds([]);
    setSubmitting(false);
    setOpen(false);
  }

  function togglePartner(id: string) {
    setPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  if (!open) {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-indigo-200 bg-indigo-50 px-4 py-4">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Task *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Assigned To *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">â€” select â€”</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !employeeId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
            >
              {submitting ? "Addingâ€¦" : "Add Task"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-white text-gray-600 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {employees.length > 1 && (
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Partners (optional)</label>
            <div className="flex flex-wrap gap-2">
              {employees
                .filter((e) => e.id !== employeeId)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => togglePartner(e.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      partnerIds.includes(e.id)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

