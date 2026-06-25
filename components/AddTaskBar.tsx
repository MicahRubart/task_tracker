"use client";

import { useEffect, useRef, useState } from "react";
import { createTask } from "@/app/actions/tasks";
import { Department, Goal } from "@/app/generated/prisma/client";
import { colorForName, buildColorMap } from "@/lib/colors";
import { DEPARTMENTS } from "@/lib/departments";

interface Employee { id: string; name: string; departments?: string[] }

interface Props {
  department: Department;
  employees: Employee[];
  allEmployees: Employee[];
  goals: Goal[];
}

export function AddTaskBar({ department, employees, allEmployees, goals }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const deptColorMap = buildColorMap(employees);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    setSearch("");
    setSubmitting(false);
    setOpen(false);
  }

  function togglePartner(id: string) {
    setPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  // Dept employees that are not the assignee
  const deptPartners = employees.filter((e) => e.id !== employeeId);

  // Employees outside this department, not already picked
  const otherEmployees = allEmployees.filter(
    (e) => !employees.some((de) => de.id === e.id)
  );

  // Filter by search query
  const searchResults = search.trim().length > 0
    ? otherEmployees.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    : otherEmployees;

  // Currently selected cross-dept partners (for display)
  const selectedOtherPartners = otherEmployees.filter((e) => partnerIds.includes(e.id));

  function deptLabelFor(emp: Employee): string {
    const d = emp.departments?.[0];
    return DEPARTMENTS.find((dept) => dept.value === d)?.label ?? "";
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

        {/* Partners section */}
        <div className="mt-3 space-y-2">
          <label className="text-xs font-semibold text-indigo-700 block">Partners (optional)</label>

          {/* Dept team — quick-pick pills */}
          {deptPartners.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deptPartners.map((e) => {
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
          )}

          {/* Cross-department search */}
          <div ref={searchContainerRef} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Add partner from another department..."
                  className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
              {/* Selected cross-dept partner pills */}
              {selectedOtherPartners.map((e) => {
                const color = colorForName(e.name);
                return (
                  <span
                    key={e.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    {e.name}
                    <button
                      type="button"
                      onClick={() => togglePartner(e.id)}
                      className="ml-0.5 hover:opacity-60 leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Dropdown results — opens to the right to avoid going off the bottom of the page */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-full top-0 ml-2 z-20 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {searchResults.map((e) => {
                    const picked = partnerIds.includes(e.id);
                    const color = colorForName(e.name);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onMouseDown={(ev) => { ev.preventDefault(); togglePartner(e.id); setSearch(""); setSearchOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-indigo-50 transition-colors ${picked ? "bg-indigo-50" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                          <span className="font-medium text-gray-800">{e.name}</span>
                        </span>
                        <span className="text-xs text-gray-400">{deptLabelFor(e)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
