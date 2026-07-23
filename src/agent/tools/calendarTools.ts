import { Type } from "@google/genai";
import { createCalendarEvent, listCalendarEvents } from "../../google/calendarClient";
import { buildAuthUrl } from "../../auth/googleAuth";
import { createReminder } from "../../db/repositories/reminderRepository";
import { dedupeCloseTimes, jstTimeOnDate, onlyFuture } from "../../util/jstTime";
import type { ToolModule } from "./types";

export const calendarTools: ToolModule = {
  declarations: [
    {
      name: "create_calendar_event",
      description:
        "Googleカレンダーに新しい予定を登録する。登録すると当日の朝9時（時刻指定ありの予定は開始1時間前にも）に自動でリマインドする",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "予定のタイトル" },
          start_at: {
            type: Type.STRING,
            description:
              "開始日時のISO8601文字列（例: 2026-07-20T19:00:00+09:00）。all_day=trueの場合はYYYY-MM-DD形式の日付のみ",
          },
          end_at: {
            type: Type.STRING,
            description: "終了日時のISO8601文字列。省略時は開始の1時間後（all_day=trueの場合はYYYY-MM-DD、省略時は開始の翌日）",
          },
          location: { type: Type.STRING, description: "場所（任意）" },
          all_day: { type: Type.BOOLEAN, description: "終日の予定かどうか（省略時はfalse）" },
        },
        required: ["title", "start_at"],
      },
    },
    {
      name: "list_calendar_events",
      description: "Googleカレンダーの予定を一覧取得する",
      parameters: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING, description: "検索範囲の開始日時ISO8601。省略時は現在時刻" },
          to: { type: Type.STRING, description: "検索範囲の終了日時ISO8601。省略時はfromの7日後" },
        },
      },
    },
  ],
  handlers: {
    create_calendar_event: async (args, ctx) => {
      const allDay = args.all_day === true;
      const result = await createCalendarEvent(ctx.userId, {
        title: String(args.title),
        startAt: String(args.start_at),
        endAt: args.end_at ? String(args.end_at) : undefined,
        location: args.location ? String(args.location) : undefined,
        allDay,
      });
      if (!result.connected) {
        return { connected: false, authUrl: buildAuthUrl(ctx.lineUserId) };
      }

      const eventStart = new Date(result.event.startAt);
      const candidateTimes = allDay
        ? [jstTimeOnDate(eventStart, 9)]
        : dedupeCloseTimes([jstTimeOnDate(eventStart, 9), new Date(eventStart.getTime() - 60 * 60 * 1000)]);

      for (const t of onlyFuture(candidateTimes)) {
        await createReminder(ctx.userId, `予定: ${result.event.title}`, t, "schedule");
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
