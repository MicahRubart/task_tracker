"use client";

import { useEffect, useState } from "react";
import { addEmployee, deactivateEmployee } from "@/app/actions/employees";
import { Department, Employee } from "@/app/generated/prisma/client";
import { DEPARTMENTS } from "@/lib/departments";

interface Props {
  employees: Employee[];
}

export function EmployeeManager({ employees }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState<Department>("IMPLEMENTATION");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const handler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    window.addEventListener("wpt_admin_changed", handler);
    return () => window.removeEventListener("wpt_admin_changed", handler);
  }, []);

  if (!isAdmin) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await addEmployee(name.trim(), dept);
    setName("");
    setSubmitting(false);
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        title="Manage employees"
        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Manage Employees</h2>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value as Department)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
              >
                Add
              </button>
            </form>

            <div className="space-y-1">
              {employees.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{e.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {DEPARTMENTS.find((d) => d.value === e.department)?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Deactivate ${e.name}? They won't appear in dropdowns.`)) {
                        deactivateEmployee(e.id);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Deactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

