import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { tasks } from "../schema";

export type Task = typeof tasks.$inferSelect;

export async function createTask(
  userId: number,
  title: string,
  dueAt?: Date
): Promise<Task> {
  const [created] = await db
    .insert(tasks)
    .values({ userId, title, dueAt })
    .returning();
  return created;
}

export async function listTasks(
  userId: number,
  status?: "open" | "done"
): Promise<Task[]> {
  return db.query.tasks.findMany({
    where: status
      ? and(eq(tasks.userId, userId), eq(tasks.status, status))
      : eq(tasks.userId, userId),
    orderBy: (t, { asc }) => [asc(t.dueAt)],
  });
}

export async function completeTask(userId: number, taskId: number): Promise<Task | undefined> {
  const [updated] = await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();
  return updated;
}

export async function deleteTask(userId: number, taskId: number): Promise<void> {
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function getTask(userId: number, taskId: number): Promise<Task | undefined> {
  return db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
  });
}
