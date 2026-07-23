import { eq } from "drizzle-orm";
import type { Content } from "@google/genai";
import { db } from "../db/client";
import { messages } from "../db/schema";

const HISTORY_LIMIT = 20;

export async function loadHistory(userId: number): Promise<Content[]> {
  const rows = await db.query.messages.findMany({
    where: eq(messages.userId, userId),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    limit: HISTORY_LIMIT,
  });

  const contents = rows
    .reverse()
    .map((row): Content => ({
      role: row.role === "assistant" ? "model" : "user",
      parts: [{ text: row.content }],
    }));

  return sanitizeHistory(contents);
}

/**
 * Gemini APIは履歴が「user」で始まり、user/modelが厳密に交互である必要がある。
 * 過去のエラーで応答が保存されなかった等の理由で崩れていても落ちないよう、
 * 先頭のuser以外を捨て、連続同ロールは古い方を捨てて交互構造を保証する。
 */
function sanitizeHistory(contents: Content[]): Content[] {
  const startIndex = contents.findIndex((c) => c.role === "user");
  if (startIndex === -1) return [];

  const result: Content[] = [];
  for (const content of contents.slice(startIndex)) {
    const last = result[result.length - 1];
    if (last && last.role === content.role) {
      result[result.length - 1] = content;
    } else {
      result.push(content);
    }
  }
  return result;
}

export async function saveMessage(
  userId: number,
  role: "user" | "assistant",
  content: string,
  lineMessageId?: string
): Promise<void> {
  await db.insert(messages).values({ userId, role, content, lineMessageId });
}
