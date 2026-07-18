import { eq } from "drizzle-orm";
import type { Content } from "@google/generative-ai";
import { db } from "../db/client";
import { messages } from "../db/schema";

const HISTORY_LIMIT = 20;

export async function loadHistory(userId: number): Promise<Content[]> {
  const rows = await db.query.messages.findMany({
    where: eq(messages.userId, userId),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    limit: HISTORY_LIMIT,
  });

  return rows
    .reverse()
    .map((row): Content => ({
      role: row.role === "assistant" ? "model" : "user",
      parts: [{ text: row.content }],
    }));
}

export async function saveMessage(
  userId: number,
  role: "user" | "assistant",
  content: string,
  lineMessageId?: string
): Promise<void> {
  await db.insert(messages).values({ userId, role, content, lineMessageId });
}
