import { plainText } from "./plain-text";

const WORDS_PER_MINUTE = 220;

/**
 * Whole minutes (minimum 1) to read a markdown body: prose only, so code
 * blocks, tables, link URLs and images are not counted.
 */
export function readingTimeMinutes(markdown: string): number {
	const withoutTables = markdown.replace(/^\s*\|.*\|\s*$/gm, "");
	const words = plainText(withoutTables).split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
