/** Locale-independent so server render and client hydration always agree. */
export function formatDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}
