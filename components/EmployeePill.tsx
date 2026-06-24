"use client";

import { colorForName } from "@/lib/colors";

interface Props {
  name: string;
  size?: "xs" | "sm" | "md";
}

export function EmployeePill({ name, size = "sm" }: Props) {
  const color = colorForName(name);
  const padding =
    size === "md" ? "px-2.5 py-1 text-sm" :
    size === "xs" ? "px-1.5 py-0.5 text-[10px]" :
    "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap
        ${color.bg} ${color.text} ${color.border} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`} />
      {name}
    </span>
  );
}
