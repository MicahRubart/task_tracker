"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/departments";
import { NotificationBell } from "./NotificationBell";

export function DeptNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0.5 px-4 bg-indigo-800">
      {DEPARTMENTS.map((dept) => {
        const href = `/dept/${dept.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={dept.slug}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
              active
                ? "bg-white text-indigo-800 shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/10"
            }`}
          >
            {dept.label}
          </Link>
        );
      })}

      {/* Divider */}
      <span className="mx-2 self-center w-px h-4 bg-white/20" />

      {/* History tab */}
      <Link
        href="/history"
        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
          pathname.startsWith("/history")
            ? "bg-white text-indigo-800 shadow-sm"
            : "text-indigo-200 hover:text-white hover:bg-white/10"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Work History
      </Link>

      {/* Notification bell — sits beside Work History */}
      <div className="flex items-center ml-1 pb-0.5">
        <NotificationBell />
      </div>
    </nav>
  );
}
