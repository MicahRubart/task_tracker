"use client";

import { useEffect, useState } from "react";
import { Employee } from "@/app/generated/prisma/client";

interface Props {
  employees: Employee[];
}

export function EmployeeSelector({ employees }: Props) {
  const [selected, setSelected] = useState<string>("");

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

  const name = employees.find((e) => e.id === selected)?.name;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Signed in as</span>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm font-medium text-gray-800 border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">â€” select name â€”</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      {name && (
        <span className="text-xs text-gray-400">({name})</span>
      )}
    </div>
  );
}

