import { SchemaType } from "@google/generative-ai";
import { createCalendarEvent, listCalendarEvents } from "../../google/calendarClient";
import { buildAuthUrl } from "../../auth/googleAuth";
import type { ToolModule } from "./types";

export const calendarTools: ToolModule = {
  declarations: [
    {
      name: "create_calendar_event",
      description: "Googleカレンダーに新しい予定を登録する",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "予定のタイトル" },
          start_at: { type: SchemaType.STRING, description: "開始日時のISO8601文字列（例: 2026-07-20T19:00:00+09:00）" },
          end_at: { type: SchemaType.STRING, description: "終了日時のISO8601文字列。省略時は開始の1時間後" },
          location: { type: SchemaType.STRING, description: "場所（任意）" },
        },
        required: ["title", "start_at"],
      },
    },
    {
      name: "list_calendar_events",
      description: "Googleカレンダーの予定を一覧取得する",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          from: { type: SchemaType.STRING, description: "検索範囲の開始日時ISO8601。省略時は現在時刻" },
          to: { type: SchemaType.STRING, description: "検索範囲の終了日時ISO8601。省略時はfromの7日後" },
        },
      },
    },
  ],
  handlers: {
    create_calendar_event: async (args, ctx) => {
      const result = await createCalendarEvent(ctx.userId, {
        title: String(args.title),
        startAt: String(args.start_at),
        endAt: args.end_at ? String(args.end_at) : undefined,
        location: args.location ? String(args.location) : undefined,
      });
      if (!result.connected) {
        return { connected: false, authUrl: buildAuthUrl(ctx.lineUserId) };
      }
      return { connected: true, event: result.event };
    },
    list_calendar_events: async (args, ctx) => {
      const result = await listCalendarEvents(
        ctx.userId,
        args.from ? String(args.from) : undefined,
        args.to ? String(args.to) : undefined
      );
      if (!result.connected) {
        return { connected: false, authUrl: buildAuthUrl(ctx.lineUserId) };
      }
      return { connected: true, events: result.events };
    },
  },
};
