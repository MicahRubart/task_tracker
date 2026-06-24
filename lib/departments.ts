export const DEPARTMENTS = [
  { slug: "implementation",     label: "Implementation",     value: "IMPLEMENTATION"     },
  { slug: "web-services",       label: "Web Services",       value: "WEB_SERVICES"       },
  { slug: "training",           label: "Training",           value: "TRAINING"           },
  { slug: "conversion",         label: "Conversion",         value: "CONVERSION"         },
  { slug: "strategic-solutions",label: "Strategic Solutions",value: "STRATEGIC_SOLUTIONS"},
  { slug: "operations",         label: "Operations",         value: "OPERATIONS"         },
] as const;

export type DeptSlug = (typeof DEPARTMENTS)[number]["slug"];

export function deptFromSlug(slug: string) {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

export function slugFromValue(value: string) {
  return DEPARTMENTS.find((d) => d.value === value)?.slug ?? "implementation";
}
