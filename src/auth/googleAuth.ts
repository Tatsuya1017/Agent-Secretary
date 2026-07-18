import { Router } from "express";
import { google } from "googleapis";
import { config } from "../config";
import { findOrCreateUserByLineId, getUserById, saveGoogleTokens } from "../db/repositories/userRepository";
import { logger } from "../util/logger";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function createOAuthClient() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

/** チャットから「予定登録して」と言われたが未連携の場合に案内する認可URL */
export function buildAuthUrl(lineUserId: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // 毎回同意させることで refresh_token を確実に受け取る
    scope: SCOPES,
    state: lineUserId,
  });
}

/** 指定ユーザーのGoogleカレンダーAPIを呼べる状態のOAuth2Clientを返す。未連携ならnull。 */
export async function getOAuthClientForUser(userId: number) {
  const user = await getUserById(userId);
  if (!user?.googleRefreshToken) return null;

  const client = createOAuthClient();
  client.setCredentials({
    refresh_token: user.googleRefreshToken,
    access_token: user.googleAccessToken ?? undefined,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined,
  });

  client.on("tokens", (tokens) => {
    saveGoogleTokens(userId, {
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    }).catch((err) => logger.error("Googleトークンの保存に失敗しました", err));
  });

  return client;
}

const router = Router();

router.get("/auth/google", (req, res) => {
  const lineUserId = req.query.state as string | undefined;
  if (!lineUserId) {
    res.status(400).send("state (LINEユーザーID) が指定されていません");
    return;
  }
  res.redirect(buildAuthUrl(lineUserId));
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const lineUserId = req.query.state as string | undefined;

  if (!code || !lineUserId) {
    res.status(400).send("認可コードまたはstateがありません");
    return;
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    const user = await findOrCreateUserByLineId(lineUserId);

    await saveGoogleTokens(user.id, {
      refreshToken: tokens.refresh_token ?? undefined,
      accessToken: tokens.access_token ?? undefined,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    });

    res.send("Googleカレンダー連携が完了しました。LINEに戻ってご利用ください。");
  } catch (err) {
    logger.error("Google OAuthコールバックでエラー", err);
    res.status(500).send("連携に失敗しました。もう一度お試しください。");
  }
});

export default router;
