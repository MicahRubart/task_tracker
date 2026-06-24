-- TriggerType enum
CREATE TYPE "TriggerType" AS ENUM ('OVERDUE_BY_DAYS', 'DUE_IN_DAYS', 'NO_UPDATE_IN_DAYS');

-- Department-level settings (Teams webhook URL)
CREATE TABLE "DepartmentSettings" (
  "department"      "Department" NOT NULL,
  "teamsWebhookUrl" TEXT,
  PRIMARY KEY ("department")
);

-- Notification rules per department
CREATE TABLE "NotificationRule" (
  "id"              TEXT NOT NULL,
  "department"      "Department" NOT NULL,
  "name"            TEXT NOT NULL,
  "triggerType"     "TriggerType" NOT NULL,
  "triggerDays"     INTEGER NOT NULL,
  "messageTemplate" TEXT NOT NULL,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Log of sent notifications (prevents spam)
CREATE TABLE "NotificationLog" (
  "id"      TEXT NOT NULL,
  "ruleId"  TEXT NOT NULL,
  "taskId"  TEXT NOT NULL,
  "sentAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE CASCADE
);

CREATE INDEX "NotificationLog_ruleId_taskId_idx" ON "NotificationLog"("ruleId", "taskId");
