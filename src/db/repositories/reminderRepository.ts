import { and, eq, lte } from "drizzle-orm";
import { db } from "../client";
import { reminders } from "../schema";

export type Reminder = typeof reminders.$inferSelect;

export async function createReminder(
  userId: number,
  text: string,
  dueAt: Date,
  source: "manual" | "task" | "schedule" = "manual",
  sourceTaskId?: number
): Promise<Reminder> {
  const [created] = await db
    .insert(reminders)
    .values({ userId, text, dueAt, source, sourceTaskId })
    .returning();
  return created;
}

export async function listReminders(userId: number): Promise<Reminder[]> {
  return db.query.reminders.findMany({
    where: and(eq(reminders.userId, userId), eq(reminders.status, "pending")),
    orderBy: (r, { asc }) => [asc(r.dueAt)],
  });
}

export async function cancelReminder(userId: number, reminderId: number): Promise<void> {
  await db
    .update(reminders)
    .set({ status: "cancelled" })
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));
}

/**
 * 期限が来た pending なリマインダーを「1回のアトミックなUPDATE」で sent に確保する。
 * SELECTしてからUPDATEする2段階にすると、cron呼び出しが重複実行された際に同じ
 * リマインダーを二重にPushしてしまう恐れがあるため、単一のUPDATE...RETURNINGで完結させる。
 */
export async function claimDueReminders(): Promise<Reminder[]> {
  return db
    .update(reminders)
    .set({ status: "sent", sentAt: new Date() })
    .where(and(eq(reminders.status, "pending"), lte(reminders.dueAt, new Date())))
    .returning();
}
