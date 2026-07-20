import { logger } from "./logger";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);

function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  return typeof status === "number" && RETRYABLE_STATUS_CODES.has(status);
}

/**
 * Gemini APIは高負荷時に503 (Service Unavailable)を返すことがあり、
 * 数秒待てば復帰することが多いため、一時的なエラーのみ指数バックオフで再試行する。
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
      if (attempt === retries || !isRetryableError(err)) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      logger.warn(`一時的なエラーのため再試行します (${attempt + 1}/${retries})`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}
