import { cookies } from "next/headers";

export type Theme = "light" | "dark";

/** Read from cookie so the server renders the right theme (no flash). */
export async function getTheme(): Promise<Theme> {
  return (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
}
