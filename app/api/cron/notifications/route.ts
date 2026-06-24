import { NextRequest, NextResponse } from "next/server";
import { runNotifications } from "@/lib/notificationEngine";

export async function GET(req: NextRequest) {
  // Protect the endpoint with a secret so only authorized callers can trigger it
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = req.nextUrl.origin;

  try {
    const result = await runNotifications(baseUrl);
    console.log("[cron/notifications]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/notifications] fatal error", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
