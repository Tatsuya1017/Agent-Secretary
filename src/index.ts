import express from "express";
import { config } from "./config";
import webhookRouter from "./line/webhook";
import googleAuthRouter from "./auth/googleAuth";
import cronRouter from "./scheduler/cronRoutes";
import { logger } from "./util/logger";

const app = express();

// LINEのwebhookは署名検証のため自前でbody parsingを行うので、
// express.json() などのグローバルなbody parserは使わない。
app.use(webhookRouter);
app.use(googleAuthRouter);
app.use(cronRouter);

app.get("/", (_req, res) => {
  res.send("あねちゃん、稼働中です。");
});

app.listen(config.port, () => {
  logger.info(`あねちゃんサーバーを起動しました port=${config.port}`);
});
