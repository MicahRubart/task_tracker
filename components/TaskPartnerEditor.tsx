"use client";

import { useState, useRef, useEffect } from "react";
import { addPartnerToTask, removePartnerFromTask } from "@/app/actions/tasks";
import { colorForName } from "@/lib/colors";
import { DEPARTMENTS } from "@/lib/departments";

interface Employee { id: string; name: string; departments?: string[] }

interface Props {
  taskId: string;
  currentPartners: { employeeId: string; employee: { name: string } }[];
  allEmployees: Employee[];
  currentEmployeeId: string;
}

function deptLabel(emp: Employee): string {
  const d = emp.departments?.[0];
  return DEPARTMENTS.find((dept) => dept.value === d)?.label ?? "";
}

export function TaskPartnerEditor({ taskId, currentPartners, allEmployees, currentEmployeeId }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const partnerIds = new Set(currentPartners.map((p) => p.employeeId));

  const results = allEmployees.filter(
    (e) =>
      !partnerIds.has(e.id) &&
      e.name.toLowerCase().includes(search.toLowerCase()) &&
      search.trim().length > 0
  ).slice(0, 8);

  async function handleAdd(emp: Employee) {
    setBusy(emp.id);
    await addPartnerToTask(taskId, emp.id);
    setSearch("");
    setOpen(false);
    setBusy(null);
  }

  async function handleRemove(empId: string) {
    setBusy(empId);
    await removePartnerFromTask(taskId, empId);
    setBusy(null);
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Partners</h4>

      {/* Current partners */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {currentPartners.length === 0 && (
          <span className="text-xs text-gray-400 italic">No partners yet.</span>
        )}
        {currentPartners.map((p) => {
          const color = colorForName(p.employee.name);
          return (
            <span
              key={p.employeeId}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
              {p.employee.name}
              {currentEmployeeId && (
                <button
                  type="button"
                  onClick={() => handleRemove(p.employeeId)}
                  disabled={busy === p.employeeId}
                  className="ml-0.5 hover:opacity-60 leading-none disabled:opacity-30"
                  title="Remove partner"
                >
                  {busy === p.employeeId ? "…" : "×"}
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Add partner search */}
      {currentEmployeeId && (
        <div ref={containerRef} className="relative inline-block">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Add a partner..."
              className="w-52 border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>

          {open && results.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-30 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {results.map((e) => {
                const color = colorForName(e.name);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onMouseDown={(ev) => { ev.preventDefault(); handleAdd(e); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                      <span className="font-medium text-gray-800">{e.name}</span>
                    </span>
                    <span className="text-xs text-gray-400">{deptLabel(e)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
