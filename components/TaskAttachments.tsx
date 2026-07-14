"use client";

import { useState } from "react";
import { addAttachment, deleteAttachment } from "@/app/actions/attachments";
import type { TaskAttachment, Employee } from "@/app/generated/prisma/client";

interface Props {
  taskId: string;
  attachments: (TaskAttachment & { addedBy: Employee })[];
  currentEmployeeId: string;
}

function urlDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function linkIcon(url: string) {
  const domain = urlDomain(url);
  if (domain.includes("docs.google") || domain.includes("drive.google")) {
    return (
      <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        <path d="M14 2v6h6"/>
      </svg>
    );
  }
  if (domain.includes("sharepoint") || domain.includes("office") || domain.includes("microsoft")) {
    return (
      <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (domain.includes("loom") || domain.includes("youtube") || domain.includes("vimeo")) {
    return (
      <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (domain.includes("confluence") || domain.includes("atlassian") || domain.includes("notion")) {
    return (
      <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export function TaskAttachments({ taskId, attachments, currentEmployeeId }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !currentEmployeeId) return;
    setSubmitting(true);
    await addAttachment({ taskId, title: title.trim(), url: url.trim(), addedById: currentEmployeeId });
    setTitle("");
    setUrl("");
    setSubmitting(false);
    setAdding(false);
  }

  async function handleDelete(id: string) {
    await deleteAttachment(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Documents &amp; Links
          {attachments.length > 0 && (
            <span className="ml-2 font-normal normal-case text-gray-400">{attachments.length}</span>
          )}
        </h4>
        {!adding && currentEmployeeId && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Add link
          </button>
        )}
      </div>

      {attachments.length === 0 && !adding && (
        <p className="text-xs text-gray-400 italic">No links added yet.</p>
      )}

      <div className="space-y-1.5 mb-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="group flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
          >
            {linkIcon(att.url)}
            <div className="flex-1 min-w-0">
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
              >
                {att.title}
              </a>
              <p className="text-[10px] text-gray-400 truncate">{urlDomain(att.url)} · {att.addedBy.name}</p>
            </div>
            {currentEmployeeId && (
              <button
                onClick={() => handleDelete(att.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                title="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="space-y-2 bg-white border border-indigo-200 rounded-lg p-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Label (e.g. Project Brief, Recording)"
            required
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (e.g. https://...)"
            required
            type="url"
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => { setAdding(false); setTitle(""); setUrl(""); }}
              className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !url.trim()}
              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 font-medium"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
