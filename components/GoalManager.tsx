"use client";

import { useState } from "react";
import { createGoal, archiveGoal } from "@/app/actions/goals";
import { Department, Goal } from "@/app/generated/prisma/client";
import { DEPARTMENTS } from "@/lib/departments";

interface Props {
  department: Department;
  goals: Goal[];
  isAdmin: boolean;
}

export function GoalManager({ department, goals, isAdmin }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAdmin) return null;

  const deptLabel = DEPARTMENTS.find((d) => d.value === department)?.label;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await createGoal(department, title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
    setSaving(false);
    setShowForm(false);
  }

  return (
    <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-semibold text-indigo-700">
            Goals & Initiatives — {deptLabel}
          </span>
          <span className="text-xs text-indigo-400">({goals.length})</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>

      {/* Goal pills */}
      {goals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {goals.map((g) => (
            <div
              key={g.id}
              className="group flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full px-3 py-1"
              title={g.description ?? ""}
            >
              <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-indigo-700">{g.title}</span>
              <button
                onClick={() => {
                  if (confirm(`Archive goal "${g.title}"?`)) archiveGoal(g.id);
                }}
                className="text-indigo-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 leading-none text-base"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2 items-end mt-2">
          <div className="flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal or initiative title"
              autoFocus
              required
              className="w-full border border-indigo-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex-1">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full border border-indigo-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {saving ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 bg-white text-gray-500 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
