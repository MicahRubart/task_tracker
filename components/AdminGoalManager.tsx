"use client";

import { useEffect, useState } from "react";
import { GoalManager } from "./GoalManager";
import { Department, Goal } from "@/app/generated/prisma/client";

interface Props {
  department: Department;
  goals: Goal[];
}

export function AdminGoalManager({ department, goals }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("wpt_admin") === "1");
    const handler = (e: Event) => setIsAdmin((e as CustomEvent).detail === true);
    window.addEventListener("wpt_admin_changed", handler);
    return () => window.removeEventListener("wpt_admin_changed", handler);
  }, []);

  if (!isAdmin) return null;
  return <GoalManager department={department} goals={goals} isAdmin={isAdmin} />;
}
