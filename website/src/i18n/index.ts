import type { Translation } from "./zh";
import zh from "./zh";
import en from "./en";

export type { Translation } from "./zh";

export type Language = "zh" | "en";

export const translations: Record<Language, Translation> = { zh, en };
