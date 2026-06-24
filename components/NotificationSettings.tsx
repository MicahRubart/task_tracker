"use client";

import { useEffect, useState } from "react";
import {
  getDepartmentSettings,
  saveDepartmentSettings,
  getRulesForDept,
  createRule,
  updateRule,
  deleteRule,
} from "@/app/actions/notifications";
import { Department, NotificationRule, TriggerType } from "@/app/generated/prisma/client";
import { DEPARTMENTS } from "@/lib/departments";

// ---------- Template helpers ----------

const TRIGGER_LABELS: Record<TriggerType, string> = {
  OVERDUE_BY_DAYS:   "Task is overdue by N days",
  DUE_IN_DAYS:       "Task is due within N days",
  NO_UPDATE_IN_DAYS: "No update posted in N days",
};

const TEMPLATE_VARS = [
  { var: "{employee}",   desc: "Assigned employee's name" },
  { var: "{task}",       desc: "Task title" },
  { var: "{dueDate}",    desc: "Due date (formatted)" },
  { var: "{daysOverdue}",desc: "# days overdue" },
  { var: "{daysUntil}",  desc: "# days until due" },
  { var: "{status}",     desc: "Current task status" },
  { var: "{department}", desc: "Department name" },
  { var: "{manager}",    desc: "\"your manager\"" },
];

const DEFAULT_TEMPLATES: Record<TriggerType, string> = {
  OVERDUE_BY_DAYS:
    "Hi {employee}! Your task '{task}' was due on {dueDate} and is now {daysOverdue} day(s) overdue. Please update your status or reach out if you need support.",
  DUE_IN_DAYS:
    "Hi {employee}! Just a heads up — your task '{task}' is due on {dueDate} ({daysUntil} day(s) away). Please make sure it's on track!",
  NO_UPDATE_IN_DAYS:
    "Hi {employee}! It looks like there haven't been any updates on '{task}' recently. Can you drop a quick note on where things stand?",
};

// ---------- Sub-components ----------

function RuleForm({
  dept,
  existing,
  onSave,
  onCancel,
}: {
  dept: Department;
  existing?: NotificationRule;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName]               = useState(existing?.name ?? "");
  const [triggerType, setTriggerType] = useState<TriggerType>(existing?.triggerType ?? "OVERDUE_BY_DAYS");
  const [triggerDays, setTriggerDays] = useState(existing?.triggerDays ?? 1);
  const [template, setTemplate]       = useState(existing?.messageTemplate ?? DEFAULT_TEMPLATES["OVERDUE_BY_DAYS"]);
  const [saving, setSaving]           = useState(false);

  function handleTriggerTypeChange(t: TriggerType) {
    setTriggerType(t);
    if (!existing) setTemplate(DEFAULT_TEMPLATES[t]);
  }

  function insertVar(v: string) {
    setTemplate((prev) => prev + v);
  }

  async function handleSave() {
    if (!name.trim() || !template.trim()) return;
    setSaving(true);
    if (existing) {
      await updateRule(existing.id, { name, triggerType, triggerDays, messageTemplate: template });
    } else {
      await createRule({ department: dept, name, triggerType, triggerDays, messageTemplate: template });
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-indigo-200 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Rule Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Overdue alert"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Trigger</label>
          <select
            value={triggerType}
            onChange={(e) => handleTriggerTypeChange(e.target.value as TriggerType)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Days (N)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={triggerDays}
            onChange={(e) => setTriggerDays(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-600">Message Template</label>
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_VARS.map((v) => (
              <button
                key={v.var}
                type="button"
                onClick={() => insertVar(v.var)}
                title={v.desc}
                className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-200 transition-colors font-mono"
              >
                {v.var}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Click a variable above to insert it. Variables are replaced with real task data when the message is sent.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !template.trim()}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving..." : existing ? "Save Changes" : "Create Rule"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 bg-white text-gray-600 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function NotificationSettings() {
  const [isAdmin, setIsAdmin]         = useState(false);
  const [showPanel, setShowPanel]     = useState(false);
  const [activeDept, setActiveDept]   = useState<Department>("WEB_SERVICES");
  const [webhookUrl, setWebhookUrl]   = useState("");
  const [savedWebhook, setSavedWebhook] = useState("");
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSaved, setWebhookSaved]   = useState(false);
  const [rules, setRules]             = useState<NotificationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const handler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    window.addEventListener("wpt_admin_changed", handler);
    return () => window.removeEventListener("wpt_admin_changed", handler);
  }, []);

  useEffect(() => {
    if (!showPanel) return;
    loadDeptData(activeDept);
  }, [showPanel, activeDept]);

  async function loadDeptData(dept: Department) {
    setLoadingRules(true);
    const [settings, deptRules] = await Promise.all([
      getDepartmentSettings(dept),
      getRulesForDept(dept),
    ]);
    setWebhookUrl(settings?.teamsWebhookUrl ?? "");
    setSavedWebhook(settings?.teamsWebhookUrl ?? "");
    setRules(deptRules);
    setLoadingRules(false);
  }

  async function handleSaveWebhook() {
    setWebhookSaving(true);
    await saveDepartmentSettings(activeDept, webhookUrl);
    setSavedWebhook(webhookUrl);
    setWebhookSaving(false);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2500);
  }

  async function handleToggleRule(rule: NotificationRule) {
    await updateRule(rule.id, { active: !rule.active });
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r));
  }

  async function handleDeleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        title="Notification settings"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-md transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Notifications
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-[640px] max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-indigo-700 px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Teams Notification Rules</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Automated messages sent to your Teams channel when rules trigger
                  </p>
                </div>
                <button onClick={() => setShowPanel(false)} className="text-indigo-200 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Department tabs */}
              <div className="flex gap-1 mt-3">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => { setActiveDept(d.value as Department); setShowNewRule(false); setEditingRuleId(null); }}
                    className={`px-3 py-1 rounded-t-md text-xs font-medium transition-colors ${
                      activeDept === d.value
                        ? "bg-white text-indigo-800"
                        : "text-indigo-200 hover:bg-white/15"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Webhook URL */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">
                    <strong>Setup:</strong> In your Teams channel → ··· → Connectors → Incoming Webhook → Configure → copy the URL and paste below.
                  </p>
                </div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Teams Incoming Webhook URL for{" "}
                  {DEPARTMENTS.find((d) => d.value === activeDept)?.label}
                </label>
                <div className="flex gap-2">
                  <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={webhookSaving || webhookUrl === savedWebhook}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    {webhookSaving ? "Saving..." : webhookSaved ? "✓ Saved" : "Save URL"}
                  </button>
                </div>
              </div>

              {/* Rules list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Notification Rules</h3>
                  {!showNewRule && (
                    <button
                      onClick={() => setShowNewRule(true)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Rule
                    </button>
                  )}
                </div>

                {showNewRule && (
                  <div className="mb-3">
                    <RuleForm
                      dept={activeDept}
                      onSave={() => { setShowNewRule(false); loadDeptData(activeDept); }}
                      onCancel={() => setShowNewRule(false)}
                    />
                  </div>
                )}

                {loadingRules ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm">No rules yet — add one above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.id}>
                        {editingRuleId === rule.id ? (
                          <RuleForm
                            dept={activeDept}
                            existing={rule}
                            onSave={() => { setEditingRuleId(null); loadDeptData(activeDept); }}
                            onCancel={() => setEditingRuleId(null)}
                          />
                        ) : (
                          <div className={`rounded-lg border p-3 transition-colors ${rule.active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? "bg-green-500" : "bg-gray-300"}`} />
                                  <span className={`text-sm font-semibold ${rule.active ? "text-gray-800" : "text-gray-400"}`}>
                                    {rule.name}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {TRIGGER_LABELS[rule.triggerType]} — {rule.triggerDays} day{rule.triggerDays !== 1 ? "s" : ""}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 truncate italic">
                                  "{rule.messageTemplate.slice(0, 80)}{rule.messageTemplate.length > 80 ? "…" : ""}"
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleToggleRule(rule)}
                                  className={`text-xs px-2 py-1 rounded-md font-medium border transition-colors ${
                                    rule.active
                                      ? "text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                                      : "text-green-600 border-green-200 hover:bg-green-50"
                                  }`}
                                >
                                  {rule.active ? "Pause" : "Enable"}
                                </button>
                                <button
                                  onClick={() => setEditingRuleId(rule.id)}
                                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2 py-1 rounded-md border border-transparent hover:border-indigo-200"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-xs text-gray-300 hover:text-red-500 px-2 py-1 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cron setup info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-800 mb-1">Scheduling automatic checks</p>
                <p className="text-xs text-amber-700 mb-2">
                  Rules are evaluated by calling this URL once per day. Use a free service like{" "}
                  <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="underline font-medium">cron-job.org</a>{" "}
                  to call it automatically, or paste it into Vercel Cron if you're on the Pro plan.
                </p>
                <div className="bg-white border border-amber-200 rounded px-3 py-2 font-mono text-xs text-gray-700 break-all select-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/cron/notifications?secret={"<CRON_SECRET>"}
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Add <code className="bg-amber-100 px-1 rounded">CRON_SECRET</code> to your environment variables and replace {"<CRON_SECRET>"} with that value.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
