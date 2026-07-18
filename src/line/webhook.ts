import { Router } from "express";
import type { WebhookEvent } from "@line/bot-sdk";
import { lineMiddleware } from "./client";
import { replyOrPush } from "./replyOrPush";
import { runAgentTurn } from "../agent/runAgentTurn";
import { logger } from "../util/logger";

const router = Router();

// event.message.id による簡易重複排除（プロセス内メモリのみ、個人利用なので十分）
const seenMessageIds = new Set<string>();
const MAX_SEEN = 500;

function isDuplicate(messageId: string): boolean {
  if (seenMessageIds.has(messageId)) return true;
  seenMessageIds.add(messageId);
  if (seenMessageIds.size > MAX_SEEN) {
    const oldest = seenMessageIds.values().next().value;
    if (oldest !== undefined) seenMessageIds.delete(oldest);
  }
  return false;
}

router.post("/webhook", lineMiddleware, (req, res) => {
  // LINE側のタイムアウトを避けるため即座に200を返し、処理は非同期で行う
  res.status(200).end();

  const events = (req.body?.events ?? []) as WebhookEvent[];
  for (const event of events) {
    handleEvent(event).catch((err) => logger.error("LINEイベント処理に失敗しました", err));
  }
});

async function handleEvent(event: WebhookEvent): Promise<void> {
  if (event.type !== "message" || event.message.type !== "text") return;
  if (isDuplicate(event.message.id)) return;

  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  const replyText = await runAgentTurn(lineUserId, event.message.text);
  await replyOrPush(event.replyToken, lineUserId, replyText);
}

export default router;
