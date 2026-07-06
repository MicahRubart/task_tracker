"use client";

import { useEffect, useState } from "react";
import { Employee, Department } from "@/app/generated/prisma/client";
import { buildColorMap, colorFromIndex } from "@/lib/colors";
import { DEPARTMENTS } from "@/lib/departments";

interface Props {
  employees: Employee[];
}

export function SignInModal({ employees }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("wpt_employee_id");
    if (!stored) setVisible(true);

    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail ?? "";
      if (id) setVisible(false);
    };
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  function signIn(id: string) {
    localStorage.setItem("wpt_employee_id", id);
    window.dispatchEvent(new CustomEvent("wpt_employee_changed", { detail: id }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-700 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">Workplan Tracker</h1>
          </div>
          <p className="text-indigo-200 text-sm">Select your name to get started</p>
        </div>

        {/* Employee list by department */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">
          {DEPARTMENTS.map((dept) => {
            const deptEmployees = employees.filter((e) =>
              (e.departments as Department[]).includes(dept.value as Department)
            );
            if (deptEmployees.length === 0) return null;

            const colorMap = buildColorMap(deptEmployees);

            return (
              <div key={dept.slug}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {dept.label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {deptEmployees.map((emp) => {
                    const color = colorFromIndex(colorMap[emp.id]);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => signIn(emp.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105 hover:shadow-md active:scale-95 ${color.bg} ${color.text} ${color.border}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                        {emp.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex justify-center">
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Browse without signing in
          </button>
        </div>
      </div>
    </div>
  );
}
