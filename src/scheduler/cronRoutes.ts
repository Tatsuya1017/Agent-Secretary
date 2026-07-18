import { Router } from "express";
import { timingSafeEqual } from "crypto";
import { config } from "../config";
import { checkAndSendDueReminders } from "./reminderScheduler";
import { logger } from "../util/logger";

const router = Router();

function isValidSecret(provided: string | undefined): boolean {
  if (!provided) return false;
  const expected = Buffer.from(config.cronSecret);
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

router.post("/cron/reminders", async (req, res) => {
  if (!isValidSecret(req.header("x-cron-secret"))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const result = await checkAndSendDueReminders();
    res.status(200).json(result);
  } catch (err) {
    logger.error("リマインダーcronの実行に失敗しました", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
