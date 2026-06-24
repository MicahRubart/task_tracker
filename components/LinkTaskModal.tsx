"use client";

import { useEffect, useRef, useState } from "react";
import { searchTasks } from "@/app/actions/tasks";
import { LinkType } from "@/app/generated/prisma/client";
import { EmployeePill } from "./EmployeePill";

interface Props {
  sourceTaskId: string;
  onLink: (targetTaskId: string, linkType: LinkType) => void;
  onClose: () => void;
}

const LINK_TYPES: { value: LinkType; label: string; description: string }[] = [
  { value: "RELATES_TO", label: "Relates to", description: "Generally connected" },
  { value: "BLOCKS",     label: "Blocks",     description: "This task must finish first" },
  { value: "SUBTASK_OF", label: "Subtask of", description: "Child of another task" },
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
      <div className="bg-white rounded-xl shadow-xl w-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-indigo-600 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Link a Task</h2>
          <p className="text-xs text-indigo-200 mt-0.5">Connect related work so nothing falls through the cracks</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Search for a task</label>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(""); }}
              placeholder="Type to search by task title..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {results.length > 0 && (
              <div className="border border-gray-200 rounded-md overflow-hidden mt-1 max-h-40 overflow-y-auto shadow-sm">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r.id); setQuery(r.title); setResults([]); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-indigo-50 transition-colors ${
                      selected === r.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <span className="font-medium text-gray-800 truncate">{r.title}</span>
                    <EmployeePill name={r.employee.name} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Relationship type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Relationship type</label>
            <div className="flex gap-2">
              {LINK_TYPES.map((lt) => (
                <button
                  key={lt.value}
                  onClick={() => setLinkType(lt.value)}
                  title={lt.description}
                  className={`flex-1 px-2 py-2 rounded-md text-xs font-semibold border transition-colors ${
                    linkType === lt.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => selected && onLink(selected, linkType)}
              disabled={!selected}
              className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              Link Task
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
