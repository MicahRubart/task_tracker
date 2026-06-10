"use client";

import { useState, useEffect } from "react";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { StatusBadge } from "./StatusBadge";
import { TaskDetail } from "./TaskDetail";
import { isOverdue, isDueThisWeek, formatDate } from "@/lib/utils";
import { TaskStatus, Department } from "@/app/generated/prisma/client";
import type { FullTask } from "@/lib/types";

interface Props {
  task: FullTask;
  employees: { id: string; name: string }[];
  isAdmin: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETE"];

export function TaskRow({ task, employees, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<null | "title" | "dueDate" | "status" | "assignee" | "partners">(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setCurrentEmployeeId(id);
    const handler = (e: Event) => setCurrentEmployeeId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  const overdue = isOverdue(task.dueDate) && task.status !== "COMPLETE";
  const dueThisWeek = !overdue && isDueThisWeek(task.dueDate) && task.status !== "COMPLETE";

  const rowBg = overdue
    ? "bg-red-50 hover:bg-red-100"
    : dueThisWeek
    ? "bg-yellow-50 hover:bg-yellow-100"
    : "bg-white hover:bg-gray-50";

  async function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    if (val && val !== task.title) {
      await updateTask(task.id, currentEmployeeId || task.employeeId, { title: val });
    }
    setEditing(null);
  }

  async function handleStatusChange(status: TaskStatus) {
    await updateTask(task.id, currentEmployeeId || task.employeeId, { status });
    setEditing(null);
  }

  async function handleDueDateBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value || null;
    await updateTask(task.id, currentEmployeeId || task.employeeId, { dueDate: val });
    setEditing(null);
  }

  async function handleAssigneeChange(employeeId: string) {
    await updateTask(task.id, currentEmployeeId || task.employeeId, {});
    setEditing(null);
    // Reassignment handled via separate flow; for now close
  }

  async function handleDeleteTask() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await deleteTask(task.id);
  }

  const partnerNames = task.partners.map((p) => p.employee.name).join(", ");

  return (
    <>
      <tr
        className={`border-b border-gray-100 transition-colors cursor-pointer select-none ${rowBg}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand indicator */}
        <td className="w-6 pl-3 py-3">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </td>

        {/* Title */}
        <td className="py-3 px-3 max-w-xs" onClick={(e) => e.stopPropagation()}>
          {editing === "title" ? (
            <input
              autoFocus
              defaultValue={task.title}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
              className="w-full border-b border-indigo-400 bg-transparent focus:outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-sm text-gray-900 font-medium cursor-text"
              onDoubleClick={() => setEditing("title")}
              title="Double-click to edit"
            >
              {task.title}
            </span>
          )}
          {overdue && (
            <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
          )}
        </td>

        {/* Assigned To */}
        <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
          {task.employee.name}
        </td>

        {/* Partners */}
        <td className="py-3 px-3 text-sm text-gray-500 max-w-[160px] truncate">
          {partnerNames || <span className="text-gray-300">â€”</span>}
        </td>

        {/* Due Date */}
        <td className="py-3 px-3 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {editing === "dueDate" ? (
            <input
              autoFocus
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              onBlur={handleDueDateBlur}
              onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
              className="border-b border-indigo-400 bg-transparent focus:outline-none text-sm"
            />
          ) : (
            <span
              className={`cursor-text ${overdue ? "text-red-700 font-medium" : dueThisWeek ? "text-yellow-700 font-medium" : "text-gray-700"}`}
              onDoubleClick={() => setEditing("dueDate")}
              title="Double-click to edit"
            >
              {formatDate(task.dueDate)}
            </span>
          )}
        </td>

        {/* Status */}
        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
          {editing === "status" ? (
            <select
              autoFocus
              defaultValue={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              onBlur={() => setEditing(null)}
              className="text-xs border border-gray-300 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          ) : (
            <span onDoubleClick={() => setEditing("status")} title="Double-click to edit" className="cursor-pointer">
              <StatusBadge status={task.status} />
            </span>
          )}
        </td>

        {/* Last Updated */}
        <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(task.updatedAt)}
        </td>

        {/* Admin delete */}
        <td className="py-3 pr-3 w-8" onClick={(e) => e.stopPropagation()}>
          {isAdmin && (
            <button
              onClick={handleDeleteTask}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className={overdue ? "bg-red-50" : dueThisWeek ? "bg-yellow-50" : "bg-gray-50"}>
          <td colSpan={8} className="p-0">
            <TaskDetail task={task} currentEmployeeId={currentEmployeeId} />
          </td>
        </tr>
      )}
    </>
  );
}

