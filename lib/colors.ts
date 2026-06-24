// Deterministic color assignment — same name always gets same color
const PALETTE = [
  { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200",  dot: "bg-violet-400"  },
  { bg: "bg-sky-100",     text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-400"     },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-400"  },
  { bg: "bg-pink-100",    text: "text-pink-700",    border: "border-pink-200",    dot: "bg-pink-400"    },
  { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200",    dot: "bg-teal-400"    },
  { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
  { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200",    dot: "bg-rose-400"    },
  { bg: "bg-indigo-100",  text: "text-indigo-700",  border: "border-indigo-200",  dot: "bg-indigo-400"  },
  { bg: "bg-cyan-100",    text: "text-cyan-700",    border: "border-cyan-200",    dot: "bg-cyan-400"    },
] as const;

export type EmployeeColor = (typeof PALETTE)[number];

export function colorForName(name: string): EmployeeColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
