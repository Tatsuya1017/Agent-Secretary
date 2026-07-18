import type { FunctionDeclaration } from "@google/generative-ai";
import { calendarTools } from "./calendarTools";
import { taskTools } from "./taskTools";
import { memoTools } from "./memoTools";
import { reminderTools } from "./reminderTools";
import type { ToolContext, ToolHandler } from "./types";

const allModules = [calendarTools, taskTools, memoTools, reminderTools];

export const toolDeclarations: FunctionDeclaration[] = allModules.flatMap((m) => m.declarations);

const toolHandlers: Record<string, ToolHandler> = Object.assign({}, ...allModules.map((m) => m.handlers));

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  const handler = toolHandlers[name];
  if (!handler) {
    return { error: `不明なツールです: ${name}` };
  }
  return handler(args, ctx);
}
