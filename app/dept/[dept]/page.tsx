import { notFound } from "next/navigation";
import { deptFromSlug } from "@/lib/departments";
import { getTasksForDept } from "@/app/actions/tasks";
import { getEmployeesForDept } from "@/app/actions/employees";
import { getGoalsForDept } from "@/app/actions/goals";
import { TaskTable } from "@/components/TaskTable";
import { AddTaskBar } from "@/components/AddTaskBar";
import { GoalManager } from "@/components/GoalManager";
import { Department } from "@/app/generated/prisma/client";

// GoalManager needs isAdmin from the client — wrap it in a client shell
import { AdminGoalManager } from "@/components/AdminGoalManager";

interface Props {
  params: Promise<{ dept: string }>;
}

export default async function DeptPage({ params }: Props) {
  const { dept } = await params;
  const deptConfig = deptFromSlug(dept);
  if (!deptConfig) notFound();

  const department = deptConfig.value as Department;

  const [tasks, employees, goals] = await Promise.all([
    getTasksForDept(department),
    getEmployeesForDept(department),
    getGoalsForDept(department),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <AdminGoalManager department={department} goals={goals} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <TaskTable tasks={tasks} employees={employees} goals={goals} />
      </div>
      <AddTaskBar department={department} employees={employees} goals={goals} />
    </div>
  );
}
