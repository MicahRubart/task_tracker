"use client";

import { useEffect, useRef, useState } from "react";
import { searchTasks } from "@/app/actions/tasks";
import { LinkType } from "@/app/generated/prisma/client";

interface Props {
  sourceTaskId: string;
  onLink: (targetTaskId: string, linkType: LinkType) => void;
  onClose: () => void;
}

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: "RELATES_TO", label: "Relates to" },
  { value: "BLOCKS", label: "Blocks" },
  { value: "SUBTASK_OF", label: "Subtask of" },
];

export function LinkTaskModal({ sourceTaskId, onLink, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; employee: { name: string } }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [linkType, setLinkType] = useState<LinkType>("RELATES_TO");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await searchTasks(query);
      setResults(r.filter((t) => t.id !== sourceTaskId));
    }, 250);
    return () => clearTimeout(t);
  }, [query, sourceTaskId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Link a Task</h2>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(""); }}
          placeholder="Search tasks by titleâ€¦"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
        />

        {results.length > 0 && (
          <div className="border border-gray-200 rounded-md overflow-hidden mb-3 max-h-40 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelected(r.id); setQuery(r.title); setResults([]); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between ${
                  selected === r.id ? "bg-indigo-50 font-medium" : ""
                }`}
              >
                <span>{r.title}</span>
                <span className="text-gray-400 text-xs">{r.employee.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Relationship type</label>
          <div className="flex gap-2">
            {LINK_TYPES.map((lt) => (
              <button
                key={lt.value}
                onClick={() => setLinkType(lt.value)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  linkType === lt.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => selected && onLink(selected, linkType)}
            disabled={!selected}
            className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Link Task
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

