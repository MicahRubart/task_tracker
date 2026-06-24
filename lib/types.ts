import type {
  Task, Employee, TaskNote, DueDateHistory,
  TaskLink, TaskPartner, Goal,
} from "@/app/generated/prisma/client";

export type FullTask = Task & {
  employee: Employee;
  goal: Goal | null;
  partners: (TaskPartner & { employee: Employee })[];
  notes: (TaskNote & { author: Employee })[];
  dueDateHistory: (DueDateHistory & { changedBy: Employee })[];
  linksFrom: (TaskLink & { targetTask: Task & { employee: Employee } })[];
  linksTo: (TaskLink & { sourceTask: Task & { employee: Employee } })[];
};
