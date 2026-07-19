/**
 * 与えられた日時が属するJST(Asia/Tokyo)の暦日で、指定した時:分のDateを作る。
 * Asia/TokyoはDST無しの固定UTC+9なので、ISO文字列に+09:00を付けるだけで正しく計算できる。
 */
export function jstTimeOnDate(reference: Date, hour: number, minute = 0): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${parts}T${hh}:${mm}:00+09:00`);
}

/** 数ミリ秒以内の近い時刻をまとめて重複を除く */
export function dedupeCloseTimes(times: Date[], toleranceMs = 60_000): Date[] {
  const out: Date[] = [];
  for (const t of times) {
    if (!out.some((o) => Math.abs(o.getTime() - t.getTime()) < toleranceMs)) {
      out.push(t);
    }
  }
  return out;
}

/** 現在時刻より未来のものだけを残す */
export function onlyFuture(times: Date[], now = new Date()): Date[] {
  return times.filter((t) => t > now);
}
