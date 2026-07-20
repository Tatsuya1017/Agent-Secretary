import type { Part } from "@google/generative-ai";
import { getModel } from "./geminiClient";
import { buildSystemPrompt } from "./systemPrompt";
import { loadHistory, saveMessage } from "./history";
import { toolDeclarations, callTool } from "./tools";
import type { ToolContext } from "./tools/types";
import { findOrCreateUserByLineId } from "../db/repositories/userRepository";
import { logger } from "../util/logger";
import { withRetry } from "../util/retry";

const MAX_TOOL_ITERATIONS = 5;

export async function runAgentTurn(lineUserId: string, userText: string): Promise<string> {
  const user = await findOrCreateUserByLineId(lineUserId);
  const history = await loadHistory(user.id);
  await saveMessage(user.id, "user", userText);

  const ctx: ToolContext = { userId: user.id, lineUserId };

  let finalText: string;
  try {
    const model = getModel(toolDeclarations, buildSystemPrompt(new Date()));
    const chat = model.startChat({ history });

    let result = await withRetry(() => chat.sendMessage(userText));

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const functionCalls = result.response.functionCalls();
      if (!functionCalls || functionCalls.length === 0) break;

      const responseParts: Part[] = await Promise.all(
        functionCalls.map(async (call) => {
          let output: unknown;
          try {
            output = await callTool(call.name, (call.args ?? {}) as Record<string, unknown>, ctx);
          } catch (err) {
            logger.error(`ツール実行に失敗しました: ${call.name}`, err);
            output = { error: "ツールの実行に失敗しました" };
          }
          return {
            functionResponse: { name: call.name, response: output as object },
          };
        })
      );

      result = await withRetry(() => chat.sendMessage(responseParts));
    }

    finalText = result.response.text() || "うまく応答できなかった…もう一回言ってみて？";
  } catch (err) {
    // ここで応答を保存しないと会話履歴のuser/model交互構造が崩れ、
    // 次回のstartChatが「First content should be with role 'user'」で失敗し続ける
    logger.error("Gemini呼び出しに失敗しました", err);
    finalText = "ちょっと調子が悪いみたい…少し待ってからもう一回送ってみて？";
  }

  await saveMessage(user.id, "assistant", finalText);
  return finalText;
}
