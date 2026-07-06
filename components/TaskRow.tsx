"use client";

import { useState, useEffect } from "react";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { StatusBadge } from "./StatusBadge";
import { TaskDetail } from "./TaskDetail";
import { EmployeePill } from "./EmployeePill";
import { ChangeDueDateModal } from "./ChangeDueDateModal";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { getDueUrgency, getDaysUntilLabel, URGENCY_CELL, formatDate, getStuckCountdown } from "@/lib/utils";
import type { FullTask } from "@/lib/types";

interface Props {
  task: FullTask;
  employees: { id: string; name: string }[];
  allEmployees: { id: string; name: string; departments?: string[] }[];
  isAdmin: boolean;
  colorMap: Record<string, number>;
}

export function TaskRow({ task, employees, allEmployees, isAdmin, colorMap }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showDateModal, setShowDateModal]     = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setCurrentEmployeeId(id);
    const handler = (e: Event) => setCurrentEmployeeId((e as CustomEvent).detail ?? "");
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  const isComplete       = task.status === "COMPLETE";
  const urgency          = getDueUrgency(task.dueDate, isComplete);
  const urgencyStyle     = URGENCY_CELL[urgency];
  const daysUntilLabel   = getDaysUntilLabel(task.dueDate, isComplete);
  const dateLocked     = task.dueDateHistory.length >= 1;
  const stuckCountdown = getStuckCountdown(task.stuckDeadline, task.status);

  async function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    if (val && val !== task.title) {
      await updateTask(task.id, currentEmployeeId || task.employeeId, { title: val });
    }
    setEditingTitle(false);
  }

  // Status is now changed via modal — no inline handler needed

  async function handleDeleteTask() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await deleteTask(task.id);
  }

  return (
    <>
      <tr
        className="border-b border-gray-100 transition-colors cursor-pointer select-none bg-white hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <td className="w-6 pl-3 py-3">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </td>

        {/* Title + goal badge */}
        <td className="py-2 px-3 max-w-xs" onClick={(e) => e.stopPropagation()}>
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={task.title}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingTitle(false);
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full border-b-2 border-indigo-400 bg-transparent focus:outline-none text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="group/title">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-900 font-medium">
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                  className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 shrink-0"
                  title="Edit task title"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              {task.goal && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  {task.goal.title}
                </span>
              )}
            </div>
          )}
        </td>

        {/* Assigned To */}
        <td className="py-2 px-3 whitespace-nowrap">
          <EmployeePill name={task.employee.name} colorIndex={colorMap[task.employeeId]} />
        </td>

        {/* Partners */}
        <td className="py-2 px-3">
          <div className="flex flex-wrap gap-1">
            {task.partners.length === 0
              ? <span className="text-gray-300 text-sm">—</span>
              : task.partners.map((p) => (
                  <EmployeePill key={p.employeeId} name={p.employee.name} colorIndex={colorMap[p.employeeId]} />
                ))
            }
          </div>
        </td>

        {/* Due Date — locked or clickable */}
        <td
          className={`py-1 px-1 text-sm whitespace-nowrap ${urgencyStyle.bg}`}
          onClick={(e) => e.stopPropagation()}
        >
          {dateLocked ? (
            /* Locked — show date with a lock icon, not clickable */
            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${urgencyStyle.text}`}>
              <svg
                className="w-3 h-3 text-gray-400 shrink-0"
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <span>{formatDate(task.dueDate)}</span>
                {daysUntilLabel && (
                  <span className="block text-xs font-bold uppercase tracking-wide opacity-75 leading-tight">
                    {daysUntilLabel}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Unlocked — click to open modal */
            <div
              className={`flex flex-col items-start px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${urgencyStyle.text}`}
              onClick={(e) => { e.stopPropagation(); setShowDateModal(true); }}
              title="Click to change due date (once only)"
            >
              <span>{formatDate(task.dueDate)}</span>
              {daysUntilLabel && (
                <span className="text-xs font-bold uppercase tracking-wide opacity-75 leading-tight">
                  {daysUntilLabel}
                </span>
              )}
            </div>
          )}
        </td>

        {/* Status + stuck countdown */}
        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-1">
            <span
              onClick={(e) => { e.stopPropagation(); setShowStatusModal(true); }}
              title="Click to change status"
              className="cursor-pointer inline-block"
            >
              <StatusBadge status={task.status} />
            </span>
            {stuckCountdown && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stuckCountdown.overdue
                    ? "bg-red-600 text-white"
                    : stuckCountdown.days <= 1
                    ? "bg-red-100 text-red-700"
                    : stuckCountdown.days <= 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {stuckCountdown.overdue
                  ? `${stuckCountdown.days}d overdue`
                  : stuckCountdown.days === 0
                  ? "Due today"
                  : `${stuckCountdown.days}d left`}
              </span>
            )}
          </div>
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
        <tr className="bg-gray-50">
          <td colSpan={8} className="p-0">
            <TaskDetail task={task} currentEmployeeId={currentEmployeeId} allEmployees={allEmployees} />
          </td>
        </tr>
      )}

      {showStatusModal && (
        <ChangeStatusModal
          taskId={task.id}
          taskTitle={task.title}
          currentStatus={task.status}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {showDateModal && (
        <ChangeDueDateModal
          taskId={task.id}
          taskTitle={task.title}
          currentDate={task.dueDate}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setShowDateModal(false)}
        />
      )}
    </>
  );
}
