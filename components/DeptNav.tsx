"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/departments";

export function DeptNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-gray-200 px-4">
      {DEPARTMENTS.map((dept) => {
        const href = `/dept/${dept.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={dept.slug}
            href={href}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            {dept.label}
          </Link>
        );
      })}
    </nav>
  );
}
