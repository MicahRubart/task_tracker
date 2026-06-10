import { notFound } from "next/navigation";
import { deptFromSlug } from "@/lib/departments";
import { getTasksForDept } from "@/app/actions/tasks";
import { getEmployees } from "@/app/actions/employees";
import { TaskTable } from "@/components/TaskTable";
import { AddTaskBar } from "@/components/AddTaskBar";
import { Department } from "@/app/generated/prisma/client";

interface Props {
  params: Promise<{ dept: string }>;
}

export default async function DeptPage({ params }: Props) {
  const { dept } = await params;
  const deptConfig = deptFromSlug(dept);
  if (!deptConfig) notFound();

  const [tasks, employees] = await Promise.all([
    getTasksForDept(deptConfig.value as Department),
    getEmployees(),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h2 className="text-sm font-semibold text-gray-700">{deptConfig.label}</h2>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <TaskTable tasks={tasks} employees={employees} />
      </div>
      <AddTaskBar department={deptConfig.value as Department} employees={employees} />
    </div>
  );
}
