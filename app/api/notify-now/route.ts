import { NextRequest, NextResponse } from "next/server";
import { fireRuleForTask } from "@/lib/notificationEngine";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { ruleId, taskId } = await req.json();
  if (!ruleId || !taskId) {
    return NextResponse.json({ error: "ruleId and taskId required" }, { status: 400 });
  }

  try {
    const rule = await db.notificationRule.findUniqueOrThrow({ where: { id: ruleId } });
    const settings = await db.departmentSettings.findUnique({ where: { department: rule.department } });
    if (!settings?.teamsWebhookUrl) {
      return NextResponse.json({ error: "No Teams webhook configured for this department" }, { status: 400 });
    }
    await fireRuleForTask(ruleId, taskId, settings.teamsWebhookUrl, req.nextUrl.origin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-now]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
