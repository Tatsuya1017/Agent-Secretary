import type { FunctionDeclaration } from "@google/genai";

export interface ToolContext {
  userId: number;
  lineUserId: string;
}

export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;

export interface ToolModule {
  declarations: FunctionDeclaration[];
  handlers: Record<string, ToolHandler>;
}
