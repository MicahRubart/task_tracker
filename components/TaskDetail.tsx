"use client";

import { useState } from "react";
import { addNote } from "@/app/actions/notes";
import { linkTasks, unlinkTasks } from "@/app/actions/links";
import { formatDateTime, formatDate } from "@/lib/utils";
import { LinkTaskModal } from "./LinkTaskModal";
import type { FullTask } from "@/lib/types";

interface Props {
  task: FullTask;
  currentEmployeeId: string;
}

export function TaskDetail({ task, currentEmployeeId }: Props) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !currentEmployeeId) return;
    setSubmitting(true);
    await addNote(task.id, note.trim(), currentEmployeeId);
    setNote("");
    setSubmitting(false);
  }

  const allLinks = [
    ...task.linksFrom.map((l) => ({
      id: l.id,
      linkType: l.linkType,
      direction: "from" as const,
      otherTask: l.targetTask,
    })),
    ...task.linksTo.map((l) => ({
      id: l.id,
      linkType: l.linkType,
      direction: "to" as const,
      otherTask: l.sourceTask,
    })),
  ];

  function linkLabel(linkType: string, direction: "from" | "to") {
    if (linkType === "BLOCKS") return direction === "from" ? "Blocks" : "Blocked by";
    if (linkType === "SUBTASK_OF") return direction === "from" ? "Subtask of" : "Parent of";
    return "Related to";
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 p-4 bg-gray-50 border-t border-gray-200">
      {/* Notes */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Progress Notes
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {task.notes.length === 0 && (
            <p className="text-xs text-gray-400 italic">No notes yet.</p>
          )}
          {task.notes.map((n) => (
            <div key={n.id} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-800">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {n.author.name} · {formatDateTime(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={currentEmployeeId ? "Add a note…" : "Sign in to add notes"}
            disabled={!currentEmployeeId || submitting}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!note.trim() || !currentEmployeeId || submitting}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>

      {/* Due Date History + Links */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Due Date History
          </h4>
          {task.dueDateHistory.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No changes recorded.</p>
          ) : (
            <div className="space-y-1">
              {task.dueDateHistory.map((h) => (
                <div key={h.id} className="text-xs text-gray-600 flex gap-1">
                  <span className="text-gray-400">{formatDateTime(h.changedAt)}</span>
                  <span>—</span>
                  <span>
                    {h.changedBy.name} changed from{" "}
                    <span className="font-medium">{formatDate(h.oldDate)}</span> to{" "}
                    <span className="font-medium">{formatDate(h.newDate)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Linked Tasks
            </h4>
            <button
              onClick={() => setShowLinkModal(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Link task
            </button>
          </div>
          {allLinks.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No linked tasks.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allLinks.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs"
                >
                  <span className="text-gray-400">{linkLabel(l.linkType, l.direction)}:</span>
                  <span className="font-medium text-gray-800">{l.otherTask.title}</span>
                  <span className="text-gray-400">({l.otherTask.employee.name})</span>
                  <button
                    onClick={() => unlinkTasks(l.id)}
                    className="ml-1 text-gray-300 hover:text-red-500 leading-none"
                    title="Remove link"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLinkModal && (
        <LinkTaskModal
          sourceTaskId={task.id}
          onLink={(targetId, linkType) => {
            linkTasks(task.id, targetId, linkType);
            setShowLinkModal(false);
          }}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}
