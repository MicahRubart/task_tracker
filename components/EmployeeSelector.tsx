"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Employee, Department } from "@/app/generated/prisma/client";
import { buildColorMap, colorFromIndex, colorForName } from "@/lib/colors";
import { DEPARTMENTS } from "@/lib/departments";

interface Props {
  employees: Employee[];
}

function deptFromPathname(pathname: string): Department | null {
  const match = pathname.match(/^\/dept\/([^/]+)/);
  if (!match) return null;
  const slug = match[1];
  const found = DEPARTMENTS.find((d) => d.slug === slug);
  return found ? (found.value as Department) : null;
}

export function EmployeeSelector({ employees }: Props) {
  const [selected, setSelected] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("wpt_employee_id");
    if (stored) setSelected(stored);
  }, []);

  function handleChange(id: string) {
    setSelected(id);
    if (id) {
      localStorage.setItem("wpt_employee_id", id);
    } else {
      localStorage.removeItem("wpt_employee_id");
    }
    window.dispatchEvent(new CustomEvent("wpt_employee_changed", { detail: id }));
  }

  // Filter employees to only those in the current department tab
  const currentDept = deptFromPathname(pathname);
  const visibleEmployees = currentDept
    ? employees.filter((e) => (e.departments as Department[]).includes(currentDept))
    : employees;

  const deptLabel = DEPARTMENTS.find((d) => d.value === currentDept)?.label ?? null;

  const colorMap = buildColorMap(visibleEmployees);
  const selectedEmployee = employees.find((e) => e.id === selected);
  const color = selectedEmployee
    ? (colorMap[selectedEmployee.id] !== undefined
        ? colorFromIndex(colorMap[selectedEmployee.id])
        : colorForName(selectedEmployee.name))
    : null;

  // If the selected employee isn't in this department, clear the visual indicator
  // but keep them stored so switching tabs restores their selection
  const selectedIsVisible = visibleEmployees.some((e) => e.id === selected);

  const isSignedIn = !!(selectedIsVisible && selected);

  return (
    <div className="flex items-center gap-2 relative">
      {color && selectedIsVisible && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`}
          title={selectedEmployee?.name}
        />
      )}

      <div className="relative">
        <select
          value={selectedIsVisible ? selected : ""}
          onChange={(e) => handleChange(e.target.value)}
          className={`text-sm font-medium border rounded-md px-2 py-1 focus:outline-none focus:ring-2 transition-all ${
            isSignedIn
              ? "bg-indigo-700 border-indigo-500 text-white focus:ring-white/50"
              : "bg-yellow-400 border-yellow-300 text-yellow-900 font-semibold animate-pulse focus:ring-yellow-200"
          }`}
          style={{ colorScheme: isSignedIn ? "dark" : "light" }}
        >
          <option value="" className="bg-indigo-900 text-indigo-200">
            {deptLabel ? `${deptLabel} team...` : "Select your name"}
          </option>
          {visibleEmployees.map((e) => (
            <option key={e.id} value={e.id} className="bg-indigo-900 text-white">
              {e.name}
            </option>
          ))}
        </select>

        {/* Floating sign-in prompt — only shown when not signed in */}
        {!isSignedIn && (
          <div className="absolute top-full left-0 mt-2.5 z-50 pointer-events-none">
            {/* Arrow */}
            <div className="w-3 h-3 bg-yellow-400 rotate-45 ml-4 -mb-1.5 border-l border-t border-yellow-300" />
            <div className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-lg border border-yellow-300 whitespace-nowrap">
              Select your name to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
