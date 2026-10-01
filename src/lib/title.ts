// Post titles may mark code with backticks, as in markdown: "Ignored `AGENTS.md`".
// Pages render the code parts as <code>; plain-text uses (tab title, meta,
// RSS, search matching, share cards) take plainTitle().

export interface TitlePart {
	text: string;
	code: boolean;
}

const CODE_SPAN = /`([^`]+)`/g;

export function titleParts(title: string): TitlePart[] {
	const parts: TitlePart[] = [];
	let last = 0;
	for (const m of title.matchAll(CODE_SPAN)) {
		if (m.index > last) parts.push({ text: title.slice(last, m.index), code: false });
		parts.push({ text: m[1], code: true });
		last = m.index + m[0].length;
	}
	if (last < title.length) parts.push({ text: title.slice(last), code: false });
	return parts;
}

export function plainTitle(title: string): string {
	return titleParts(title)
		.map((p) => p.text)
		.join("");
}
