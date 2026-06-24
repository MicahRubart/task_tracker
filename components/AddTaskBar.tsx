"use client";

import { useEffect, useRef, useState } from "react";
import { createTask } from "@/app/actions/tasks";
import { Department, Goal } from "@/app/generated/prisma/client";
import { colorForName } from "@/lib/colors";

interface Props {
  department: Department;
  employees: { id: string; name: string }[];
  goals: Goal[];
}

export function AddTaskBar({ department, employees, goals }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");
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
      goalId: goalId || undefined,
      dueDate: dueDate || undefined,
      partnerIds,
    });
    setTitle("");
    setDueDate("");
    setGoalId("");
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
          className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-indigo-300 bg-indigo-50 px-4 py-4">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-indigo-700 block mb-1">Task *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              required
              className="w-full border border-indigo-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-indigo-700 block mb-1">Assigned To *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="border border-indigo-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-indigo-700 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-indigo-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {goals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-indigo-700 block mb-1">Goal / Initiative</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="border border-indigo-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">No goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !employeeId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-white text-gray-600 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {employees.length > 1 && (
          <div className="mt-3">
            <label className="text-xs font-semibold text-indigo-700 block mb-2">Partners (optional)</label>
            <div className="flex flex-wrap gap-2">
              {employees
                .filter((e) => e.id !== employeeId)
                .map((e) => {
                  const color = colorForName(e.name);
                  const picked = partnerIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => togglePartner(e.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        picked
                          ? `${color.bg} ${color.text} ${color.border}`
                          : "bg-white text-gray-500 border-gray-300 hover:border-indigo-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${picked ? color.dot : "bg-gray-300"}`} />
                      {e.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
