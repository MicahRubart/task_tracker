import type { Metadata } from "next";
import { getEmployees } from "@/app/actions/employees";
import { getCompletedTasksForEmployee } from "@/app/actions/tasks";
import { HistoryView } from "@/components/HistoryView";

export const metadata: Metadata = { title: "Work History - Workplan Tracker" };

interface Props {
  searchParams: Promise<{ employee?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const { employee: employeeId } = await searchParams;

  const [employees, tasks] = await Promise.all([
    getEmployees(),
    employeeId ? getCompletedTasksForEmployee(employeeId) : Promise.resolve([]),
  ]);

  const selectedEmployee = employeeId
    ? (employees.find((e) => e.id === employeeId) ?? null)
    : null;

  return (
    <HistoryView
      employees={employees}
      tasks={tasks}
      selectedEmployee={selectedEmployee}
    />
  );
}
