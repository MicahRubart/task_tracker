"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskRow } from "./TaskRow";
import { EmployeePill } from "./EmployeePill";
import { getDueUrgency } from "@/lib/utils";
import type { FullTask } from "@/lib/types";
import type { TaskStatus, Goal } from "@/app/generated/prisma/client";

type SortKey = "title" | "employee" | "dueDate" | "status" | "updatedAt";
type SortDir = "asc" | "desc";
type DueDateFilter = "all" | "overdue" | "today" | "week" | "next-week";
type UpdatedFilter = "all" | "today" | "week" | "month";

const STATUS_FILTER_OPTIONS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all",         label: "All Statuses"  },
  { value: "NOT_STARTED", label: "Not Started"   },
  { value: "STARTED",     label: "Started"       },
  { value: "STUCK",       label: "Stuck"         },
  { value: "ON_TRACK",    label: "On Track"      },
  { value: "OFF_TRACK",   label: "Off Track"     },
  { value: "ESCALATED",   label: "Escalated"     },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: "all",       label: "All Dates"    },
  { value: "overdue",   label: "Overdue"      },
  { value: "today",     label: "Due Today"    },
  { value: "week",      label: "This Week"    },
  { value: "next-week", label: "Next 14 Days" },
];

const UPDATED_OPTIONS: { value: UpdatedFilter; label: string }[] = [
  { value: "all",   label: "Any Time"     },
  { value: "today", label: "Today"        },
  { value: "week",  label: "This Week"    },
  { value: "month", label: "This Month"   },
];

function startOf(unit: "day" | "week" | "month"): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (unit === "week") d.setDate(d.getDate() - d.getDay());
  if (unit === "month") d.setDate(1);
  return d;
}

interface Props {
  tasks: FullTask[];
  employees: { id: string; name: string }[];
  goals: Goal[];
}

export function TaskTable({ tasks, employees, goals }: Props) {
  const [isAdmin, setIsAdmin]                 = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [myTasksOnly, setMyTasksOnly]         = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [sortKey, setSortKey]                 = useState<SortKey>("dueDate");
  const [sortDir, setSortDir]                 = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter]       = useState<TaskStatus | "all">("all");
  const [dueDateFilter, setDueDateFilter]     = useState<DueDateFilter>("all");
  const [updatedFilter, setUpdatedFilter]     = useState<UpdatedFilter>("all");
  const [showCompleted, setShowCompleted]     = useState(false);
  const [goalFilter, setGoalFilter]           = useState<string>("all");

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setCurrentEmployeeId(id);
    const adminHandler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    const empHandler   = (e: Event) => setCurrentEmployeeId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_admin_changed", adminHandler);
    window.addEventListener("wpt_employee_changed", empHandler);
    return () => {
      window.removeEventListener("wpt_admin_changed", adminHandler);
      window.removeEventListener("wpt_employee_changed", empHandler);
    };
  }, []);

  function toggleSort(key: SortKey) {
    if (!isAdmin) return;
    setSortKey(key);
    setSortDir((d) => sortKey === key && d === "asc" ? "desc" : "asc");
  }

  const hasActiveFilters =
    statusFilter !== "all" || dueDateFilter !== "all" || updatedFilter !== "all" || goalFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setDueDateFilter("all");
    setUpdatedFilter("all");
    setGoalFilter("all");
  }

  // Apply all filters then sort, keeping completed separate
  const { active, completed } = useMemo(() => {
    let list = [...tasks];

    // Employee filter
    const filterBy = myTasksOnly ? currentEmployeeId : filterEmployeeId;
    if (filterBy) {
      list = list.filter(
        (t) => t.employeeId === filterBy || t.partners.some((p) => p.employeeId === filterBy)
      );
    }

    // Status filter (never hides completed from the completed section — handled below)
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Due date filter
    if (dueDateFilter !== "all") {
      const today    = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const in7      = new Date(today); in7.setDate(today.getDate() + 7);
      const in14     = new Date(today); in14.setDate(today.getDate() + 14);
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate); d.setHours(0, 0, 0, 0);
        if (dueDateFilter === "overdue")   return d < today;
        if (dueDateFilter === "today")     return d.getTime() === today.getTime();
        if (dueDateFilter === "week")      return d >= today && d <= in7;
        if (dueDateFilter === "next-week") return d >= today && d <= in14;
        return true;
      });
    }

    // Goal filter
    if (goalFilter !== "all") {
      list = list.filter((t) => t.goalId === goalFilter);
    }

    // Last updated filter
    if (updatedFilter !== "all") {
      const cutoff =
        updatedFilter === "today" ? startOf("day")  :
        updatedFilter === "week"  ? startOf("week")  :
                                    startOf("month");
      list = list.filter((t) => new Date(t.updatedAt) >= cutoff);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title")     cmp = a.title.localeCompare(b.title);
      else if (sortKey === "employee")   cmp = a.employee.name.localeCompare(b.employee.name);
      else if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db;
      } else if (sortKey === "status")   cmp = a.status.localeCompare(b.status);
      else if (sortKey === "updatedAt")  cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return {
      active:    list.filter((t) => t.status !== "COMPLETE"),
      completed: list.filter((t) => t.status === "COMPLETE"),
    };
  }, [tasks, filterEmployeeId, myTasksOnly, currentEmployeeId, sortKey, sortDir, statusFilter, dueDateFilter, updatedFilter, goalFilter]);

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
          isAdmin ? "cursor-pointer select-none text-indigo-100 hover:text-white" : "text-indigo-200"
        }`}
        onClick={() => toggleSort(col)}
      >
        {label}
        {isAdmin && (
          <span className={`ml-1 ${active ? "text-yellow-300" : "text-indigo-400"}`}>
            {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        )}
      </th>
    );
  }

  function FilterSelect<T extends string>({
    value, onChange, options, label,
  }: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    label: string;
  }) {
    const active = value !== options[0].value;
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`text-xs rounded-md px-2 py-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
            active
              ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Row 1 — employee filter */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-100">
        <button
          onClick={() => { setMyTasksOnly((v) => !v); setFilterEmployeeId(""); }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            myTasksOnly
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
          }`}
        >
          My Tasks
        </button>

        <span className="text-gray-200 text-sm">|</span>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setFilterEmployeeId(""); setMyTasksOnly(false); }}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
              !filterEmployeeId && !myTasksOnly
                ? "bg-gray-800 text-white border-gray-800"
                : "text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            All
          </button>
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => { setFilterEmployeeId(emp.id); setMyTasksOnly(false); }}
              className="transition-opacity"
              style={{ opacity: filterEmployeeId && filterEmployeeId !== emp.id ? 0.4 : 1 }}
            >
              <EmployeePill name={emp.name} />
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400 shrink-0">
          {active.length} active{completed.length > 0 && `, ${completed.length} completed`}
          {isAdmin && <span className="ml-2 text-indigo-500 font-medium">Admin — click headers to sort</span>}
        </span>
      </div>

      {/* Row 2 — date / status / updated filters */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <FilterSelect
          label="Due date"
          value={dueDateFilter}
          onChange={setDueDateFilter}
          options={DUE_DATE_OPTIONS}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
        />
        <FilterSelect
          label="Updated"
          value={updatedFilter}
          onChange={setUpdatedFilter}
          options={UPDATED_OPTIONS}
        />
        {goals.length > 0 && (
          <FilterSelect
            label="Goal"
            value={goalFilter}
            onChange={setGoalFilter}
            options={[
              { value: "all", label: "All Goals" },
              ...goals.map((g) => ({ value: g.id, label: g.title })),
            ]}
          />
        )}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium ml-1 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-indigo-700">
              <th className="w-6 pl-3" />
              <SortHeader col="title" label="Task" />
              <SortHeader col="employee" label="Assigned To" />
              <th className="py-3 px-3 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wide">
                Partners
              </th>
              <SortHeader col="dueDate" label="Due Date" />
              <SortHeader col="status" label="Status" />
              <SortHeader col="updatedAt" label="Last Updated" />
              <th className="w-8 pr-3" />
            </tr>
          </thead>
          <tbody>
            {/* Active tasks */}
            {active.length === 0 && completed.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                  No tasks yet — add the first one below!
                </td>
              </tr>
            )}
            {active.length === 0 && completed.length > 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-gray-400">
                  No active tasks match your filters.
                </td>
              </tr>
            )}
            {active.map((task) => (
              <TaskRow key={task.id} task={task} employees={employees} isAdmin={isAdmin} />
            ))}

            {/* Completed section divider */}
            {completed.length > 0 && (
              <tr className="bg-gray-100 border-t-2 border-gray-200">
                <td colSpan={8} className="py-0">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showCompleted ? "rotate-90" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-violet-600">
                      Completed ({completed.length})
                    </span>
                    <span className="text-gray-400 font-normal">
                      — {showCompleted ? "click to hide" : "click to show"}
                    </span>
                  </button>
                </td>
              </tr>
            )}

            {/* Completed tasks (collapsed by default) */}
            {showCompleted && completed.map((task) => (
              <TaskRow key={task.id} task={task} employees={employees} isAdmin={isAdmin} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
