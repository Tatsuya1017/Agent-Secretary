import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  line: {
    channelSecret: required("LINE_CHANNEL_SECRET"),
    channelAccessToken: required("LINE_CHANNEL_ACCESS_TOKEN"),
  },
  gemini: {
    apiKey: required("GEMINI_API_KEY"),
  },
  database: {
    url: required("DATABASE_URL"),
  },
  google: {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    redirectUri: required("GOOGLE_REDIRECT_URI"),
  },
  cronSecret: required("CRON_SECRET"),
  timezone: "Asia/Tokyo",
};
