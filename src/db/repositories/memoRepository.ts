import { and, eq, ilike } from "drizzle-orm";
import { db } from "../client";
import { memos } from "../schema";

export type Memo = typeof memos.$inferSelect;

export async function addMemo(
  userId: number,
  content: string,
  title?: string
): Promise<Memo> {
  const [created] = await db
    .insert(memos)
    .values({ userId, content, title })
    .returning();
  return created;
}

export async function listMemos(userId: number): Promise<Memo[]> {
  return db.query.memos.findMany({
    where: eq(memos.userId, userId),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });
}

export async function searchMemos(userId: number, query: string): Promise<Memo[]> {
  return db.query.memos.findMany({
    where: and(eq(memos.userId, userId), ilike(memos.content, `%${query}%`)),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });
}
