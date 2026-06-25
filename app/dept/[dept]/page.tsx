import { notFound } from "next/navigation";
import { deptFromSlug } from "@/lib/departments";
import { getTasksForDept } from "@/app/actions/tasks";
import { getEmployees, getEmployeesForDept } from "@/app/actions/employees";
import { getGoalsForDept } from "@/app/actions/goals";
import { TaskTable } from "@/components/TaskTable";
import { AddTaskBar } from "@/components/AddTaskBar";
import { Department } from "@/app/generated/prisma/client";
import { AdminGoalManager } from "@/components/AdminGoalManager";

interface Props {
  params: Promise<{ dept: string }>;
}

export default async function DeptPage({ params }: Props) {
  const { dept } = await params;
  const deptConfig = deptFromSlug(dept);
  if (!deptConfig) notFound();

  const department = deptConfig.value as Department;

  const [tasks, employees, allEmployees, goals] = await Promise.all([
    getTasksForDept(department),
    getEmployeesForDept(department),
    getEmployees(),
    getGoalsForDept(department),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <AdminGoalManager department={department} goals={goals} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <TaskTable tasks={tasks} employees={employees} goals={goals} />
      </div>
      <AddTaskBar department={department} employees={employees} allEmployees={allEmployees} goals={goals} />
    </div>
  );
}
