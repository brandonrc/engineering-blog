const WORDS_PER_MINUTE = 220;

/** Whole minutes (minimum 1) to read a markdown body, not counting code blocks. */
export function readingTimeMinutes(markdown: string): number {
	const prose = markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
	const words = prose.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
