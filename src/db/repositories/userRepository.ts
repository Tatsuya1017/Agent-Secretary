import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";

export type User = typeof users.$inferSelect;

export async function findOrCreateUserByLineId(
  lineUserId: string,
  displayName?: string
): Promise<User> {
  const existing = await db.query.users.findFirst({
    where: eq(users.lineUserId, lineUserId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ lineUserId, displayName })
    .returning();
  return created;
}

export async function getUserById(userId: number): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function saveGoogleTokens(
  userId: number,
  tokens: { refreshToken?: string; accessToken?: string; expiry?: Date }
): Promise<void> {
  await db
    .update(users)
    .set({
      ...(tokens.refreshToken ? { googleRefreshToken: tokens.refreshToken } : {}),
      googleAccessToken: tokens.accessToken,
      googleTokenExpiry: tokens.expiry,
    })
    .where(eq(users.id, userId));
}
