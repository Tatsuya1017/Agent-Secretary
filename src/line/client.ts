import { messagingApi, middleware } from "@line/bot-sdk";
import { config } from "../config";

export const lineClientConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
};

export const lineMiddleware = middleware(lineClientConfig);

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});
