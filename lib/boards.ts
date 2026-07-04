import type { Lang } from "./i18n";

type BoardRow = {
  name: string;
  description: string;
  name_ru: string | null;
  description_ru: string | null;
};

export function boardName(b: BoardRow, lang: Lang): string {
  return lang === "ru" && b.name_ru ? b.name_ru : b.name;
}

export function boardDescription(b: BoardRow, lang: Lang): string {
  return lang === "ru" && b.description_ru ? b.description_ru : b.description;
}
