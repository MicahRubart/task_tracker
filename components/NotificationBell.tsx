"use client";

import { useEffect, useRef, useState } from "react";
import { getActivityForEmployee } from "@/app/actions/activity";
import type { AppNotification, NotificationType } from "@/app/actions/activity";
import { DEPARTMENTS } from "@/lib/departments";

function deptLabel(dept: string): string {
  return DEPARTMENTS.find((d) => d.value === dept)?.label ?? dept;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  OVERDUE: { icon: "!", color: "text-red-600",    bg: "bg-red-50 border-red-100"      },
  MENTION: { icon: "@", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
};

export function NotificationBell() {
  const [employeeId, setEmployeeId] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications(id: string) {
    if (!id) { setNotifications([]); return; }
    setLoading(true);
    const result = await getActivityForEmployee(id);
    setNotifications(result);
    setLoading(false);
  }

  useEffect(() => {
    const id = localStorage.getItem("wpt_employee_id") ?? "";
    setEmployeeId(id);
    fetchNotifications(id);

    const handler = (e: Event) => {
      const newId = (e as CustomEvent).detail ?? "";
      setEmployeeId(newId);
      fetchNotifications(newId);
      setOpen(false);
    };
    window.addEventListener("wpt_employee_changed", handler);
    return () => window.removeEventListener("wpt_employee_changed", handler);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.length;
  const overdueCount = notifications.filter((n) => n.type === "OVERDUE").length;

  if (!employeeId) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications(employeeId);
        }}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white leading-none ${
            overdueCount > 0 ? "bg-red-500" : "bg-indigo-400"
          }`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Activity</h3>
            {loading && <span className="text-xs text-gray-400">Refreshing…</span>}
            {!loading && unread === 0 && <span className="text-xs text-gray-400">All clear</span>}
          </div>

          {notifications.length === 0 && !loading && (
            <div className="px-4 py-8 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-gray-400">No activity in the last 7 days.</p>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              return (
                <div key={n.id} className={`px-4 py-3 border-l-2 ${cfg.bg} hover:brightness-95 transition-all`} style={{ borderLeftColor: undefined }}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${cfg.color} bg-white border border-current`}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{n.taskTitle}</p>
                      <p className={`text-xs ${cfg.color}`}>{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{deptLabel(n.taskDept)} · {timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
