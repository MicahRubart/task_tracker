const PALETTE = [
  { bg: "bg-violet-100",   text: "text-violet-700",   border: "border-violet-200",   dot: "bg-violet-400"   },
  { bg: "bg-sky-100",      text: "text-sky-700",      border: "border-sky-200",      dot: "bg-sky-400"      },
  { bg: "bg-emerald-100",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-400"  },
  { bg: "bg-orange-100",   text: "text-orange-700",   border: "border-orange-200",   dot: "bg-orange-400"   },
  { bg: "bg-pink-100",     text: "text-pink-700",     border: "border-pink-200",     dot: "bg-pink-400"     },
  { bg: "bg-teal-100",     text: "text-teal-700",     border: "border-teal-200",     dot: "bg-teal-400"     },
  { bg: "bg-amber-100",    text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-400"    },
  { bg: "bg-rose-100",     text: "text-rose-700",     border: "border-rose-200",     dot: "bg-rose-400"     },
  { bg: "bg-indigo-100",   text: "text-indigo-700",   border: "border-indigo-200",   dot: "bg-indigo-400"   },
  { bg: "bg-cyan-100",     text: "text-cyan-700",     border: "border-cyan-200",     dot: "bg-cyan-400"     },
  { bg: "bg-lime-100",     text: "text-lime-700",     border: "border-lime-200",     dot: "bg-lime-400"     },
  { bg: "bg-fuchsia-100",  text: "text-fuchsia-700",  border: "border-fuchsia-200",  dot: "bg-fuchsia-400"  },
  { bg: "bg-blue-100",     text: "text-blue-700",     border: "border-blue-200",     dot: "bg-blue-400"     },
  { bg: "bg-green-100",    text: "text-green-700",    border: "border-green-200",    dot: "bg-green-400"    },
  { bg: "bg-red-100",      text: "text-red-700",      border: "border-red-200",      dot: "bg-red-400"      },
  { bg: "bg-purple-100",   text: "text-purple-700",   border: "border-purple-200",   dot: "bg-purple-400"   },
  { bg: "bg-yellow-100",   text: "text-yellow-800",   border: "border-yellow-200",   dot: "bg-yellow-400"   },
  { bg: "bg-violet-200",   text: "text-violet-800",   border: "border-violet-300",   dot: "bg-violet-500"   },
  { bg: "bg-sky-200",      text: "text-sky-800",      border: "border-sky-300",      dot: "bg-sky-500"      },
  { bg: "bg-emerald-200",  text: "text-emerald-800",  border: "border-emerald-300",  dot: "bg-emerald-500"  },
  { bg: "bg-orange-200",   text: "text-orange-800",   border: "border-orange-300",   dot: "bg-orange-500"   },
  { bg: "bg-pink-200",     text: "text-pink-800",     border: "border-pink-300",     dot: "bg-pink-500"     },
  { bg: "bg-teal-200",     text: "text-teal-800",     border: "border-teal-300",     dot: "bg-teal-500"     },
  { bg: "bg-indigo-200",   text: "text-indigo-800",   border: "border-indigo-300",   dot: "bg-indigo-500"   },
] as const;

export type EmployeeColor = (typeof PALETTE)[number];

/**
 * Assigns a color to each employee based on their alphabetical position within
 * the provided list — guarantees no two employees in the same list share a color
 * (as long as the list has <= 24 members, which covers every department).
 * Returns a map of employee id -> palette index.
 */
export function buildColorMap(
  employees: { id: string; name: string }[]
): Record<string, number> {
  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name));
  const map: Record<string, number> = {};
  sorted.forEach((e, i) => { map[e.id] = i; });
  return map;
}

export function colorFromIndex(index: number): EmployeeColor {
  return PALETTE[index % PALETTE.length];
}

/** Fallback: name-hash based color when no department context is available */
export function colorForName(name: string): EmployeeColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
