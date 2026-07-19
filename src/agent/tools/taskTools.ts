import { SchemaType } from "@google/generative-ai";
import { completeTask, createTask, deleteTask, getTask, listTasks } from "../../db/repositories/taskRepository";
import { createReminder } from "../../db/repositories/reminderRepository";
import { jstTimeOnDate, onlyFuture } from "../../util/jstTime";
import type { ToolModule } from "./types";

export const taskTools: ToolModule = {
  declarations: [
    {
      name: "create_task",
      description: "タスクを追加する。期限(due_at)を指定すると、期限日の朝9時と15時に連動リマインダーが自動で作られる",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "タスクの内容" },
          due_at: { type: SchemaType.STRING, description: "期限のISO8601日時（任意）" },
        },
        required: ["title"],
      },
    },
    {
      name: "list_tasks",
      description: "タスクの一覧を取得する",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          status: { type: SchemaType.STRING, description: "'open'(未完了) または 'done'(完了済み)。省略時は全件" },
        },
      },
    },
    {
      name: "complete_task",
      description: "タスクを完了にする",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          task_id: { type: SchemaType.NUMBER, description: "タスクID" },
        },
        required: ["task_id"],
      },
    },
    {
      name: "delete_task",
      description: "タスクを削除する",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          task_id: { type: SchemaType.NUMBER, description: "タスクID" },
        },
        required: ["task_id"],
      },
    },
  ],
  handlers: {
    create_task: async (args, ctx) => {
      const dueAt = args.due_at ? new Date(String(args.due_at)) : undefined;
      const task = await createTask(ctx.userId, String(args.title), dueAt);

      if (dueAt) {
        const reminderTimes = onlyFuture([jstTimeOnDate(dueAt, 9), jstTimeOnDate(dueAt, 15)]);
        for (const t of reminderTimes) {
          await createReminder(ctx.userId, `タスク期限: ${task.title}`, t, "task", task.id);
        }
      }

      return { task };
    },
    list_tasks: async (args, ctx) => {
      const status = args.status === "open" || args.status === "done" ? args.status : undefined;
      const tasks = await listTasks(ctx.userId, status);
      return { tasks };
    },
    complete_task: async (args, ctx) => {
      const task = await completeTask(ctx.userId, Number(args.task_id));
      if (!task) return { found: false };
      return { found: true, task };
    },
    delete_task: async (args, ctx) => {
      const task = await getTask(ctx.userId, Number(args.task_id));
      if (!task) return { found: false };
      await deleteTask(ctx.userId, Number(args.task_id));
      return { found: true };
    },
  },
};
