import { Type } from "@google/genai";
import { addMemo, listMemos, searchMemos } from "../../db/repositories/memoRepository";
import type { ToolModule } from "./types";

export const memoTools: ToolModule = {
  declarations: [
    {
      name: "add_memo",
      description: "メモを追加する",
      parameters: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "メモの内容" },
          title: { type: Type.STRING, description: "メモのタイトル（任意）" },
        },
        required: ["content"],
      },
    },
    {
      name: "list_memos",
      description: "メモの一覧を取得する（新しい順）",
      parameters: { type: Type.OBJECT, properties: {} },
    },
    {
      name: "search_memos",
      description: "メモをキーワードで検索する",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "検索キーワード" },
        },
        required: ["query"],
      },
    },
  ],
  handlers: {
    add_memo: async (args, ctx) => {
      const memo = await addMemo(
        ctx.userId,
        String(args.content),
        args.title ? String(args.title) : undefined
      );
      return { memo };
    },
    list_memos: async (_args, ctx) => {
      const memos = await listMemos(ctx.userId);
      return { memos };
    },
    search_memos: async (args, ctx) => {
      const memos = await searchMemos(ctx.userId, String(args.query));
      return { memos };
    },
  },
};
