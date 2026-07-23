import { logger } from "./logger";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);

function getStatus(err: unknown): number | undefined {
  return (err as { status?: number } | undefined)?.status;
}

/**
 * Gemini APIは高負荷時に503 (Service Unavailable)を返すことがあり、
 * 数秒待てば復帰することが多いため、一時的なエラーのみ指数バックオフで再試行する。
 *
 * 429 (RESOURCE_EXHAUSTED)は無料枠のRPM上限に達した場合に発生し、
 * 1分単位でしか回復しないうえ、1回の会話ターンでchat.sendMessageを
 * 複数回呼ぶことがあるため、通常の指数バックオフで何度も再試行すると
 * 逆に枠を圧迫して悪化させる。再試行は1回・長めの待機に留める。
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 1000 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = getStatus(err);
      if (status === undefined || !RETRYABLE_STATUS_CODES.has(status)) throw err;

      const isQuotaExhausted = status === 429;
      const maxAttemptsForError = isQuotaExhausted ? 1 : retries;
      if (attempt >= maxAttemptsForError) throw err;

      const delay = isQuotaExhausted ? 10000 : baseDelayMs * 2 ** attempt;
      logger.warn(`一時的なエラーのため再試行します (${attempt + 1}/${maxAttemptsForError})`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}
