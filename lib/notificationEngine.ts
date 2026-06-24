import { db } from "@/lib/db";
import { Department, NotificationRule, Task, Employee } from "@/app/generated/prisma/client";
import { DEPARTMENTS } from "@/lib/departments";

const RESEND_AFTER_DAYS = 3; // don't re-notify the same rule+task within 3 days

type TaskWithEmployee = Task & { employee: Employee; notes: { createdAt: Date }[] };

/** Fill template variables for a given task */
export function renderTemplate(
  template: string,
  task: TaskWithEmployee,
  extraVars: Record<string, string> = {}
): string {
  const deptLabel = DEPARTMENTS.find((d) => d.value === task.department)?.label ?? task.department;
  const dueDate   = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "no due date";

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = task.dueDate ? new Date(task.dueDate) : null;
  if (due) due.setHours(0, 0, 0, 0);
  const daysOverdue = due ? Math.max(0, Math.round((today.getTime() - due.getTime()) / 86400000)) : 0;
  const daysUntil   = due ? Math.max(0, Math.round((due.getTime() - today.getTime()) / 86400000)) : 0;

  return template
    .replace(/\{employee\}/g, task.employee.name)
    .replace(/\{task\}/g,     task.title)
    .replace(/\{dueDate\}/g,  dueDate)
    .replace(/\{department\}/g, deptLabel)
    .replace(/\{status\}/g,   task.status.replace(/_/g, " ").toLowerCase())
    .replace(/\{daysOverdue\}/g, String(daysOverdue))
    .replace(/\{daysUntil\}/g,  String(daysUntil))
    .replace(/\{link\}/g, extraVars.link ?? "")
    .replace(/\{manager\}/g, extraVars.manager ?? "your manager");
}

/** Post an Adaptive Card to a Teams Incoming Webhook */
async function postToTeams(webhookUrl: string, rule: NotificationRule, task: TaskWithEmployee, message: string) {
  const deptLabel = DEPARTMENTS.find((d) => d.value === task.department)?.label ?? task.department;

  const body = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `📋 Workplan Reminder — ${deptLabel}`,
              weight: "Bolder",
              size: "Medium",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: message,
              wrap: true,
              spacing: "Small",
            },
            {
              type: "FactSet",
              spacing: "Small",
              facts: [
                { title: "Task",       value: task.title },
                { title: "Assigned",   value: task.employee.name },
                { title: "Due Date",   value: task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Not set" },
                { title: "Status",     value: task.status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) },
                { title: "Rule",       value: rule.name },
              ],
            },
          ],
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Teams webhook failed: ${res.status} ${text}`);
  }
}

/** Check whether a rule was already fired for this task recently */
async function alreadyNotified(ruleId: string, taskId: string): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RESEND_AFTER_DAYS);
  const recent = await db.notificationLog.findFirst({
    where: {
      ruleId,
      taskId,
      sentAt: { gte: cutoff },
    },
  });
  return !!recent;
}

/** Does this task match the rule's trigger today? */
function matchesTrigger(rule: NotificationRule, task: TaskWithEmployee): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (rule.triggerType === "OVERDUE_BY_DAYS") {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.round((today.getTime() - due.getTime()) / 86400000);
    return daysOverdue >= rule.triggerDays;
  }

  if (rule.triggerType === "DUE_IN_DAYS") {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);
    return daysUntil >= 0 && daysUntil <= rule.triggerDays;
  }

  if (rule.triggerType === "NO_UPDATE_IN_DAYS") {
    const lastNote = task.notes.length > 0
      ? new Date(Math.max(...task.notes.map((n) => new Date(n.createdAt).getTime())))
      : null;
    const referenceDate = lastNote ?? new Date(task.createdAt);
    const daysSince = Math.round((today.getTime() - referenceDate.getTime()) / 86400000);
    return daysSince >= rule.triggerDays;
  }

  return false;
}

/** Run all active rules for all departments — called by the cron endpoint */
export async function runNotifications(baseUrl: string): Promise<{
  checked: number;
  fired: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checked = 0;
  let fired = 0;

  const departments = DEPARTMENTS.map((d) => d.value as Department);

  for (const department of departments) {
    const [settings, rules, tasks] = await Promise.all([
      db.departmentSettings.findUnique({ where: { department } }),
      db.notificationRule.findMany({ where: { department, active: true } }),
      db.task.findMany({
        where: { department, status: { not: "COMPLETE" } },
        include: {
          employee: true,
          notes: { select: { createdAt: true }, orderBy: { createdAt: "desc" } },
        },
      }),
    ]);

    if (!settings?.teamsWebhookUrl || rules.length === 0) continue;

    for (const rule of rules) {
      for (const task of tasks) {
        checked++;
        if (!matchesTrigger(rule, task as TaskWithEmployee)) continue;
        if (await alreadyNotified(rule.id, task.id)) continue;

        const message = renderTemplate(rule.messageTemplate, task as TaskWithEmployee, {
          link: `${baseUrl}/dept/${DEPARTMENTS.find((d) => d.value === department)?.slug}`,
        });

        try {
          await postToTeams(settings.teamsWebhookUrl, rule, task as TaskWithEmployee, message);
          await db.notificationLog.create({ data: { ruleId: rule.id, taskId: task.id } });
          fired++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Rule "${rule.name}" / Task "${task.title}": ${msg}`);
        }
      }
    }
  }

  return { checked, fired, errors };
}

/** Fire a rule immediately for a specific task (manual trigger) */
export async function fireRuleForTask(
  ruleId: string,
  taskId: string,
  webhookUrl: string,
  baseUrl: string
): Promise<void> {
  const [rule, task] = await Promise.all([
    db.notificationRule.findUniqueOrThrow({ where: { id: ruleId } }),
    db.task.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        employee: true,
        notes: { select: { createdAt: true } },
      },
    }),
  ]);

  const message = renderTemplate(rule.messageTemplate, task as TaskWithEmployee, {
    link: `${baseUrl}/dept/${DEPARTMENTS.find((d) => d.value === task.department)?.slug}`,
    manager: "your manager",
  });

  await postToTeams(webhookUrl, rule, task as TaskWithEmployee, message);
  await db.notificationLog.create({ data: { ruleId, taskId } });
}
