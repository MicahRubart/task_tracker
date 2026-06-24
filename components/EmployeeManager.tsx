"use client";

import { useEffect, useState } from "react";
import { addEmployee, deactivateEmployee, updateEmployeeDepartments } from "@/app/actions/employees";
import { Department, Employee } from "@/app/generated/prisma/client";
import { DEPARTMENTS } from "@/lib/departments";
import { EmployeePill } from "./EmployeePill";

interface Props {
  employees: Employee[];
}

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d.value as Department, label: d.label }));

function DeptCheckboxes({
  selected,
  onChange,
}: {
  selected: Department[];
  onChange: (depts: Department[]) => void;
}) {
  function toggle(val: Department) {
    onChange(
      selected.includes(val)
        ? selected.filter((d) => d !== val)
        : [...selected, val]
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {DEPT_OPTIONS.map((d) => {
        const active = selected.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-500 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmployeeManager({ employees }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [name, setName] = useState("");
  const [newDepts, setNewDepts] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDepts, setEditDepts] = useState<Department[]>([]);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const handler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    window.addEventListener("wpt_admin_changed", handler);
    return () => window.removeEventListener("wpt_admin_changed", handler);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || newDepts.length === 0) return;
    setSubmitting(true);
    await addEmployee(name.trim(), newDepts);
    setSuccessMsg(`${name.trim()} added!`);
    setName("");
    setNewDepts([]);
    setSubmitting(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function startEditing(emp: Employee) {
    setEditingId(emp.id);
    setEditDepts(emp.departments as Department[]);
  }

  async function saveEditing(emp: Employee) {
    if (editDepts.length === 0) return;
    await updateEmployeeDepartments(emp.id, editDepts);
    setEditingId(null);
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        title="Add or manage team members"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-md transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Add Employee
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-indigo-700 px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Team Members</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Employees only appear in the departments they belong to
                  </p>
                </div>
                <button
                  onClick={() => { setShowPanel(false); setEditingId(null); }}
                  className="text-indigo-200 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Add form */}
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Add a Team Member
                </h3>
                <form onSubmit={handleAdd} className="space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoFocus
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">
                      Departments <span className="text-red-400">*</span>
                    </label>
                    <DeptCheckboxes selected={newDepts} onChange={setNewDepts} />
                    {newDepts.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Select at least one department</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim() || newDepts.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {submitting ? "Adding..." : "Add Team Member"}
                  </button>
                  {successMsg && (
                    <p className="text-xs text-green-600 font-medium">✓ {successMsg}</p>
                  )}
                </form>
              </div>

              {/* Employee list */}
              <div className="p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Current Team ({employees.length})
                </h3>
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div key={emp.id} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors">
                      {editingId === emp.id ? (
                        /* Edit mode */
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{emp.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEditing(emp)}
                                disabled={editDepts.length === 0}
                                className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md font-medium disabled:opacity-40 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <DeptCheckboxes selected={editDepts} onChange={setEditDepts} />
                          {editDepts.length === 0 && (
                            <p className="text-xs text-red-500">Select at least one department</p>
                          )}
                        </div>
                      ) : (
                        /* View mode */
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <EmployeePill name={emp.name} size="md" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(emp.departments as Department[]).map((d) => (
                                <span
                                  key={d}
                                  className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                                >
                                  {DEPARTMENTS.find((dept) => dept.value === d)?.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => startEditing(emp)}
                              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${emp.name} from the team?`)) {
                                    deactivateEmployee(emp.id);
                                  }
                                }}
                                className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
