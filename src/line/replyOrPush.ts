import { lineClient } from "./client";
import { logger } from "../util/logger";

/**
 * replyToken が使える間は Reply API（無料枠を消費しない）を優先し、
 * 失効していたら Push API にフォールバックする。
 */
export async function replyOrPush(
  replyToken: string | undefined,
  lineUserId: string,
  text: string
): Promise<void> {
  if (replyToken) {
    try {
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: "text", text }],
      });
      return;
    } catch (err) {
      logger.warn("replyToken failed, falling back to push", err);
    }
  }

  await pushMessage(lineUserId, text);
}

export async function pushMessage(lineUserId: string, text: string): Promise<void> {
  await lineClient.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text }],
  });
}
