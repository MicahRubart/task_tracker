"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeePill } from "./EmployeePill";
import { buildColorMap } from "@/lib/colors";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { FullTask } from "@/lib/types";
import type { Employee } from "@/app/generated/prisma/client";

type GroupBy = "all" | "goal" | "department" | "month";

interface Props {
  employees: Employee[];
  tasks: FullTask[];
  selectedEmployee: Employee | null;
}

const DEPT_LABELS: Record<string, string> = {
  WEB_SERVICES: "Web Services",
  TRAINING: "Training",
  IMPLEMENTATION: "Implementation",
  CONVERSION: "Conversion",
  STRATEGIC_SOLUTIONS: "Strategic Solutions",
};

function formatMonth(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupTasks(tasks: FullTask[], groupBy: GroupBy): { label: string; tasks: FullTask[] }[] {
  if (groupBy === "all") return [{ label: "All Completed Tasks", tasks }];

  const map = new Map<string, FullTask[]>();

  for (const task of tasks) {
    let key: string;
    if (groupBy === "goal")       key = task.goal?.title ?? "No Goal / Initiative";
    else if (groupBy === "department") key = DEPT_LABELS[task.department] ?? task.department;
    else                          key = formatMonth(task.updatedAt);

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  return Array.from(map.entries()).map(([label, tasks]) => ({ label, tasks }));
}

function exportCSV(tasks: FullTask[], employeeName: string, selectedId: string) {
  const header = [
    "Task Title",
    "Department",
    "Goal / Initiative",
    "Role",
    "Partners",
    "Due Date",
    "Completed",
    "Notes",
  ];

  const rows = tasks.map((t) => [
    t.title,
    DEPT_LABELS[t.department] ?? t.department,
    t.goal?.title ?? "",
    t.employeeId === selectedId ? "Owner" : "Partner",
    t.partners.map((p) => p.employee.name).join("; "),
    t.dueDate ? formatDate(t.dueDate) : "",
    formatDate(t.updatedAt),
    t.notes
      .filter((n) => n.noteType === "REGULAR")
      .map((n) => n.body.replace(/\n/g, " "))
      .join(" | "),
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${employeeName.replace(/\s+/g, "-")}-work-history.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function TaskCard({
  task,
  selectedEmployeeId,
  colorMap,
}: {
  task: FullTask;
  selectedEmployeeId: string;
  colorMap: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = task.employeeId === selectedEmployeeId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Card header — always visible */}
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{task.title}</span>
            {/* Owner vs partner badge */}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isOwner
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {isOwner ? "Owner" : "Partner"}
            </span>
            {/* Dept badge */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {DEPT_LABELS[task.department] ?? task.department}
            </span>
          </div>

          {/* Goal + meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {task.goal && (
              <span className="flex items-center gap-1 text-indigo-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {task.goal.title}
              </span>
            )}
            {task.dueDate && (
              <span>Due: {formatDate(task.dueDate)}</span>
            )}
            <span className="flex items-center gap-1 text-violet-600 font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Completed {formatDate(task.updatedAt)}
            </span>
            {task.partners.length > 0 && (
              <span className="flex items-center gap-1">
                Partners:
                {task.partners.map((p) => (
                  <EmployeePill key={p.employeeId} name={p.employee.name} size="xs" colorIndex={colorMap[p.employeeId]} />
                ))}
              </span>
            )}
            {task.notes.length > 0 && (
              <span className="text-gray-400">
                {task.notes.length} note{task.notes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded notes */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
          {task.notes.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No notes recorded.</p>
          ) : (
            task.notes.map((n) => {
              const isDateChange   = n.noteType === "DATE_CHANGE";
              const isStatusChange = n.noteType === "STATUS_CHANGE";
              return (
                <div
                  key={n.id}
                  className={`rounded-lg border p-3 text-xs ${
                    isDateChange   ? "bg-amber-50 border-amber-200"   :
                    isStatusChange ? "bg-indigo-50 border-indigo-200" :
                    "bg-white border-gray-200"
                  }`}
                >
                  {isDateChange && (
                    <p className="text-amber-600 font-semibold uppercase tracking-wide mb-1">Due Date Changed</p>
                  )}
                  {isStatusChange && (
                    <p className="text-indigo-600 font-semibold uppercase tracking-wide mb-1">Status Update</p>
                  )}
                  <p className={`whitespace-pre-line ${
                    isDateChange ? "text-amber-900" : isStatusChange ? "text-indigo-900" : "text-gray-800"
                  }`}>
                    {n.body}
                  </p>
                  <p className={`mt-1 ${
                    isDateChange ? "text-amber-500" : isStatusChange ? "text-indigo-400" : "text-gray-400"
                  }`}>
                    {n.author.name} · {formatDateTime(n.createdAt)}
                  </p>
                </div>
              );
            })
          )}

          {/* Due date history */}
          {task.dueDateHistory.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date History</p>
              {task.dueDateHistory.map((h) => (
                <div key={h.id} className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs mb-1">
                  <span className="text-amber-700 font-medium">
                    {formatDate(h.oldDate)} → {formatDate(h.newDate)}
                  </span>
                  {h.reason && <span className="text-amber-600 ml-2">— {h.reason}</span>}
                  <span className="text-amber-400 ml-2">· {h.changedBy.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HistoryView({ employees, tasks, selectedEmployee }: Props) {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>("all");
  const [signedInId, setSignedInId] = useState("");
  const colorMap = useMemo(() => buildColorMap(employees), [employees]);

  useEffect(() => {
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setSignedInId(id);
    const handler = (e: Event) => setSignedInId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  function handleEmployeeChange(id: string) {
    router.push(id ? `/history?employee=${id}` : "/history");
  }

  // Stats
  const stats = useMemo(() => {
    if (!tasks.length) return null;
    const goals = new Set(tasks.map((t) => t.goal?.id).filter(Boolean));
    const depts = new Set(tasks.map((t) => t.department));
    const dates = tasks.map((t) => new Date(t.updatedAt).getTime()).sort((a, b) => a - b);
    return {
      count: tasks.length,
      goals: goals.size,
      depts: depts.size,
      earliest: new Date(dates[0]),
      latest: new Date(dates[dates.length - 1]),
    };
  }, [tasks]);

  const groups = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy]);

  const effectiveEmployeeId = selectedEmployee?.id ?? "";

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Work History</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Completed tasks and notes — use this to build your review portfolio
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Employee selector */}
            <select
              value={selectedEmployee?.id ?? ""}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">-- Select employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            {/* Quick link to own history */}
            {signedInId && signedInId !== selectedEmployee?.id && (
              <button
                onClick={() => handleEmployeeChange(signedInId)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap px-3 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                My History
              </button>
            )}

            {/* Export CSV */}
            {tasks.length > 0 && selectedEmployee && (
              <button
                onClick={() => exportCSV(tasks, selectedEmployee.name, selectedEmployee.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* No employee selected */}
        {!selectedEmployee && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-medium text-gray-500">Select an employee to view their work history</p>
            {signedInId && (
              <button
                onClick={() => handleEmployeeChange(signedInId)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
              >
                View my own history
              </button>
            )}
          </div>
        )}

        {/* Employee selected, no completed tasks */}
        {selectedEmployee && tasks.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-base font-medium text-gray-500">
              No completed tasks for {selectedEmployee.name} yet
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Tasks marked as Completed will appear here
            </p>
          </div>
        )}

        {/* Stats bar */}
        {selectedEmployee && stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-indigo-700">{stats.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tasks Completed</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-indigo-700">{stats.goals}</p>
                <p className="text-xs text-gray-500 mt-0.5">Goals Contributed</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-indigo-700">{stats.depts}</p>
                <p className="text-xs text-gray-500 mt-0.5">Departments</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center">
                <p className="text-sm font-bold text-indigo-700">
                  {formatDate(stats.earliest)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">First Completion</p>
              </div>
            </div>

            {/* Employee header */}
            <div className="flex items-center gap-2 mb-4">
              <EmployeePill name={selectedEmployee.name} colorIndex={colorMap[selectedEmployee.id]} />
              <span className="text-sm text-gray-500">
                — showing all completed tasks (owned + partnered)
              </span>
            </div>

            {/* Group by tabs */}
            <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
              {(
                [
                  { value: "all",        label: "All"         },
                  { value: "goal",       label: "By Goal"     },
                  { value: "department", label: "By Dept"     },
                  { value: "month",      label: "By Month"    },
                ] as { value: GroupBy; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGroupBy(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    groupBy === opt.value
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Task groups */}
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  {groupBy !== "all" && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-2">
                      <span className="flex-1 border-t border-gray-200" />
                      <span>{group.label}</span>
                      <span className="text-gray-300">({group.tasks.length})</span>
                      <span className="flex-1 border-t border-gray-200" />
                    </h3>
                  )}
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        selectedEmployeeId={effectiveEmployeeId}
                        colorMap={colorMap}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
