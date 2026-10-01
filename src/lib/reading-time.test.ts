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
});
