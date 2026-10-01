/** Readable words of a markdown body, for the search index. */
export function plainText(markdown: string): string {
	return markdown
		.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/^\s{0,3}(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s?)/gm, "")
		.replace(/[*`~|]/g, "")
		.replace(/(^|[^\w])_+|_+(?=[^\w]|$)/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}
