import { describe, expect, it } from "vitest";
import { readingTimeMinutes } from "./reading-time";

describe("readingTimeMinutes", () => {
	it("counts prose at 220 words a minute and ignores code blocks", () => {
		const prose = Array.from({ length: 440 }, () => "word").join(" ");
		const code = "```python\n" + Array.from({ length: 2000 }, () => "x = 1").join("\n") + "\n```";
		expect(readingTimeMinutes(`${prose}\n\n${code}\n`)).toBe(2);
	});

	it("never reports less than a minute", () => {
		expect(readingTimeMinutes("Short.")).toBe(1);
	});

	it("does not count table cells, link URLs or image references", () => {
		const prose = Array.from({ length: 220 }, () => "word").join(" ");
		const table = ["| a | b |", "|---|---|", ...Array.from({ length: 300 }, () => "| one two three | four five six |")].join("\n");
		const links = Array.from({ length: 100 }, () => "[x](https://example.com/a/b/c) ![y](images/p/a.png)").join(" ");
		expect(readingTimeMinutes(`${prose}\n\n${table}\n\n${links}\n`)).toBe(1);
	});
});
