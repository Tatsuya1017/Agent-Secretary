import { claimDueReminders } from "../db/repositories/reminderRepository";
import { getUserById } from "../db/repositories/userRepository";
import { pushMessage } from "../line/replyOrPush";
import { logger } from "../util/logger";

/**
 * 期限が来た pending なリマインダーをアトミックに確保してLINE Pushで送信する。
 * 外部cron（例: cron-job.org、5分毎）からのHTTPトリガーで呼ばれる想定の純粋な関数。
 * 将来常時稼働ホストに移行する場合は、node-cron等からこの関数を直接呼び出せばよい。
 */
export async function checkAndSendDueReminders(): Promise<{ sent: number; failed: number }> {
  const due = await claimDueReminders();
  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    const user = await getUserById(reminder.userId);
    if (!user) {
      failed++;
      continue;
    }
    try {
      await pushMessage(user.lineUserId, `⏰ リマインダー: ${reminder.text}`);
      sent++;
    } catch (err) {
      logger.error(`リマインダーのPush送信に失敗しました (id=${reminder.id})`, err);
      failed++;
    }
  }

  return { sent, failed };
}
