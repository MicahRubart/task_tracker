"use client";

import { useRef, useState } from "react";
import { addNote } from "@/app/actions/notes";
import { linkTasks, unlinkTasks } from "@/app/actions/links";
import { formatDateTime, formatDate } from "@/lib/utils";
import { LinkTaskModal } from "./LinkTaskModal";
import { TaskChecklist } from "./TaskChecklist";
import { TaskPartnerEditor } from "./TaskPartnerEditor";
import type { FullTask } from "@/lib/types";

interface Employee { id: string; name: string; departments?: string[] }

interface Props {
  task: FullTask;
  currentEmployeeId: string;
  allEmployees: Employee[];
}

function renderNoteBody(body: string, employees: Employee[]): React.ReactNode {
  if (!employees.length) return body;
  const names = employees.map((e) => e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`@(${names.join("|")})`, "g");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) parts.push(body.slice(lastIndex, match.index));
    parts.push(
      <span key={match.index} className="bg-indigo-100 text-indigo-700 rounded px-1 font-semibold">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));
  return parts.length ? <>{parts}</> : body;
}

export function TaskDetail({ task, currentEmployeeId, allEmployees }: Props) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionResults =
    mentionQuery !== null
      ? allEmployees
          .filter((e) => e.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : [];

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setNote(val);
    const cursor = e.target.selectionStart ?? val.length;
    const beforeCursor = val.slice(0, cursor);
    const match = beforeCursor.match(/@([^@\n]*)$/);
    if (match && !match[1].includes(" ")) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(emp: Employee) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart ?? note.length;
    const before = note.slice(0, mentionStart);
    const after = note.slice(cursor);
    const newText = `${before}@${emp.name} ${after}`;
    setNote(newText);
    setMentionQuery(null);
    setTimeout(() => {
      textarea.focus();
      const pos = mentionStart + emp.name.length + 2;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleNoteKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionResults.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionResults.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionResults[mentionIndex]); return; }
      if (e.key === "Escape")    { setMentionQuery(null); return; }
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !currentEmployeeId) return;
    setSubmitting(true);
    await addNote(task.id, note.trim(), currentEmployeeId);
    setNote("");
    setSubmitting(false);
  }

  const allLinks = [
    ...task.linksFrom.map((l) => ({ id: l.id, linkType: l.linkType, direction: "from" as const, otherTask: l.targetTask })),
    ...task.linksTo.map((l)   => ({ id: l.id, linkType: l.linkType, direction: "to"   as const, otherTask: l.sourceTask })),
  ];

  function linkLabel(linkType: string, direction: "from" | "to") {
    if (linkType === "BLOCKS")     return direction === "from" ? "Blocks" : "Blocked by";
    if (linkType === "SUBTASK_OF") return direction === "from" ? "Subtask of" : "Parent of";
    return "Related to";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 border-t border-gray-200">

      {/* Left col: partners + notes */}
      <div>
        {/* Goal banner */}
        {task.goal && (
          <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs text-indigo-400 leading-none">Goal / Initiative</p>
              <p className="text-xs font-semibold text-indigo-700 truncate">{task.goal.title}</p>
              {task.goal.description && (
                <p className="text-xs text-indigo-400 truncate">{task.goal.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Partners — editable */}
        <div className="mb-4">
          <TaskPartnerEditor
            taskId={task.id}
            currentPartners={task.partners}
            allEmployees={allEmployees}
            currentEmployeeId={currentEmployeeId}
          />
        </div>

        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Progress Notes
        </h4>
        <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
          {task.notes.length === 0 && (
            <p className="text-xs text-gray-400 italic">No notes yet.</p>
          )}
          {task.notes.map((n) => {
            const isDateChange   = n.noteType === "DATE_CHANGE";
            const isStatusChange = n.noteType === "STATUS_CHANGE";
            return (
              <div
                key={n.id}
                className={`rounded-lg border p-3 ${
                  isDateChange   ? "bg-amber-50 border-amber-200"   :
                  isStatusChange ? "bg-indigo-50 border-indigo-200" :
                  "bg-white border-gray-200"
                }`}
              >
                {isDateChange && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Due Date Changed</span>
                  </div>
                )}
                {isStatusChange && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Status Update</span>
                  </div>
                )}
                <p className={`text-sm whitespace-pre-line ${
                  isDateChange ? "text-amber-900" : isStatusChange ? "text-indigo-900" : "text-gray-800"
                }`}>
                  {renderNoteBody(n.body, allEmployees)}
                </p>
                <p className={`text-xs mt-1 ${
                  isDateChange ? "text-amber-500" : isStatusChange ? "text-indigo-400" : "text-gray-400"
                }`}>
                  {n.author.name} · {formatDateTime(n.createdAt)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Note input with @mention */}
        <form onSubmit={handleAddNote} className="space-y-1.5">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={note}
              onChange={handleNoteChange}
              onKeyDown={handleNoteKeyDown}
              placeholder={currentEmployeeId ? "Add a progress note… type @ to mention someone" : "Sign in to add notes"}
              disabled={!currentEmployeeId || submitting}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />

            {/* @mention dropdown */}
            {mentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 z-30 w-60 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {mentionResults.map((emp, idx) => (
                  <button
                    key={emp.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertMention(emp); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      idx === mentionIndex ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {emp.name[0]}
                    </span>
                    {emp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!note.trim() || !currentEmployeeId || submitting}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            {submitting ? "Adding…" : "Add Note"}
          </button>
        </form>
      </div>

      {/* Right col: checklist + due date history + links */}
      <div className="space-y-5">
        <TaskChecklist
          taskId={task.id}
          items={task.checklistItems}
          currentEmployeeId={currentEmployeeId}
        />

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Due Date History
          </h4>
          {task.dueDateHistory.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No changes recorded.</p>
          ) : (
            <div className="space-y-2">
              {task.dueDateHistory.map((h) => (
                <div key={h.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-medium mb-1">
                    <span>{formatDate(h.oldDate)}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-semibold">{formatDate(h.newDate)}</span>
                    <span className="text-amber-400 ml-1">· locked</span>
                  </div>
                  {h.reason && <p className="text-xs text-amber-800 mb-1">{h.reason}</p>}
                  <p className="text-xs text-amber-500">{h.changedBy.name} · {formatDateTime(h.changedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Linked Tasks</h4>
            <button onClick={() => setShowLinkModal(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              + Link task
            </button>
          </div>
          {allLinks.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No linked tasks.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allLinks.map((l) => (
                <div key={l.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs">
                  <span className="text-gray-400">{linkLabel(l.linkType, l.direction)}:</span>
                  <span className="font-medium text-gray-800">{l.otherTask.title}</span>
                  <span className="text-gray-400">({l.otherTask.employee.name})</span>
                  <button onClick={() => unlinkTasks(l.id)} className="ml-1 text-gray-300 hover:text-red-500 leading-none" title="Remove link">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLinkModal && (
        <LinkTaskModal
          sourceTaskId={task.id}
          onLink={(targetId, linkType) => { linkTasks(task.id, targetId, linkType); setShowLinkModal(false); }}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}
