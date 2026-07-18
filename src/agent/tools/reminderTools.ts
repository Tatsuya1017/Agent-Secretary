import { SchemaType } from "@google/generative-ai";
import { cancelReminder, createReminder, listReminders } from "../../db/repositories/reminderRepository";
import type { ToolModule } from "./types";

export const reminderTools: ToolModule = {
  declarations: [
    {
      name: "create_reminder",
      description: "単発のリマインダーを作成する",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "リマインド内容" },
          due_at: { type: SchemaType.STRING, description: "通知する日時のISO8601文字列" },
        },
        required: ["text", "due_at"],
      },
    },
    {
      name: "list_reminders",
      description: "未通知のリマインダー一覧を取得する",
      parameters: { type: SchemaType.OBJECT, properties: {} },
    },
    {
      name: "cancel_reminder",
      description: "リマインダーをキャンセルする",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          reminder_id: { type: SchemaType.NUMBER, description: "リマインダーID" },
        },
        required: ["reminder_id"],
      },
    },
  ],
  handlers: {
    create_reminder: async (args, ctx) => {
      const reminder = await createReminder(ctx.userId, String(args.text), new Date(String(args.due_at)));
      return { reminder };
    },
    list_reminders: async (_args, ctx) => {
      const reminders = await listReminders(ctx.userId);
      return { reminders };
    },
    cancel_reminder: async (args, ctx) => {
      await cancelReminder(ctx.userId, Number(args.reminder_id));
      return { cancelled: true };
    },
  },
};
