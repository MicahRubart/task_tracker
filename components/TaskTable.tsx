"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskRow } from "./TaskRow";
import type { FullTask } from "@/lib/types";

type SortKey = "title" | "employee" | "dueDate" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

interface Props {
  tasks: FullTask[];
  employees: { id: string; name: string }[];
}

export function TaskTable({ tasks, employees }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setCurrentEmployeeId(id);

    const adminHandler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    const empHandler = (e: Event) => setCurrentEmployeeId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_admin_changed", adminHandler);
    window.addEventListener("wpt_employee_changed", empHandler);
    return () => {
      window.removeEventListener("wpt_admin_changed", adminHandler);
      window.removeEventListener("wpt_employee_changed", empHandler);
    };
  }, []);

  function toggleSort(key: SortKey) {
    if (!isAdmin) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = [...tasks];
    const filterBy = myTasksOnly ? currentEmployeeId : filterEmployeeId;
    if (filterBy) {
      list = list.filter(
        (t) => t.employeeId === filterBy || t.partners.some((p) => p.employeeId === filterBy)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "employee") cmp = a.employee.name.localeCompare(b.employee.name);
      else if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db2 = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db2;
      } else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "updatedAt") cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [tasks, filterEmployeeId, myTasksOnly, currentEmployeeId, sortKey, sortDir]);

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${isAdmin ? "cursor-pointer select-none hover:text-gray-800" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        {isAdmin && (
          <span className={`ml-1 ${active ? "text-indigo-600" : "text-gray-300"}`}>
            {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        )}
      </th>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100">
        <button
          onClick={() => setMyTasksOnly((v) => !v)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            myTasksOnly
              ? "bg-indigo-600 text-white border-indigo-600"
              : "text-gray-600 border-gray-300 hover:border-indigo-400"
          }`}
        >
          My Tasks
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter by:</span>
          <select
            value={filterEmployeeId}
            onChange={(e) => { setFilterEmployeeId(e.target.value); setMyTasksOnly(false); }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          {isAdmin && <span className="ml-2 text-indigo-500">Admin mode — click headers to sort</span>}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <tr>
              <th className="w-6 pl-3" />
              <SortHeader col="title" label="Task" />
              <SortHeader col="employee" label="Assigned To" />
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Partners</th>
              <SortHeader col="dueDate" label="Due Date" />
              <SortHeader col="status" label="Status" />
              <SortHeader col="updatedAt" label="Last Updated" />
              <th className="w-8 pr-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                  No tasks yet. Add the first one below!
                </td>
              </tr>
            )}
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} employees={employees} isAdmin={isAdmin} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
