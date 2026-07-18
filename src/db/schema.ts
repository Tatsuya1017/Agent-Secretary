import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  lineUserId: varchar("line_user_id", { length: 64 }).notNull().unique(),
  displayName: text("display_name"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Tokyo"),
  googleRefreshToken: text("google_refresh_token"),
  googleAccessToken: text("google_access_token"),
  googleTokenExpiry: timestamp("google_token_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 16 }).notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    lineMessageId: varchar("line_message_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("messages_user_id_created_at_idx").on(table.userId, table.createdAt),
  })
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("open"), // 'open' | 'done'
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userStatusIdx: index("tasks_user_id_status_idx").on(table.userId, table.status),
  })
);

export const memos = pgTable("memos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    text: text("text").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"), // 'pending' | 'sent' | 'cancelled'
    source: varchar("source", { length: 16 }).notNull().default("manual"), // 'manual' | 'task'
    sourceTaskId: integer("source_task_id").references(() => tasks.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => ({
    statusDueIdx: index("reminders_status_due_at_idx").on(table.status, table.dueAt),
  })
);
