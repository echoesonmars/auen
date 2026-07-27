// KZT money helpers. All amounts are integers. Display format: space thousands
// separator and the ₸ symbol AFTER the number, e.g. "3 000 000 ₸".

const THIN = ' '; // non-breaking space keeps "3 000 000 ₸" from wrapping

export function formatKzt(amount: number): string {
  const n = Math.round(amount);
  const sign = n < 0 ? '−' : '';
  const digits = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return `${sign}${digits}${THIN}₸`;
}

/** Signed delta, e.g. "+45 000 ₸" / "−120 000 ₸". */
export function formatDelta(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return `0${THIN}₸`;
  const sign = n > 0 ? '+' : '−';
  const digits = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return `${sign}${digits}${THIN}₸`;
}
