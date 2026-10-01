import { describe, expect, it } from "vitest";
import { plainTitle, titleParts } from "./title";

describe("titleParts", () => {
	it("splits backtick spans out as code", () => {
		expect(titleParts("Your Agent Ignored `AGENTS.md`. Your Linter Won't.")).toEqual([
			{ text: "Your Agent Ignored ", code: false },
			{ text: "AGENTS.md", code: true },
			{ text: ". Your Linter Won't.", code: false },
		]);
	});

	it("handles several code spans, including one at the start", () => {
		expect(titleParts("`pixi` on `ubi-micro`")).toEqual([
			{ text: "pixi", code: true },
			{ text: " on ", code: false },
			{ text: "ubi-micro", code: true },
		]);
	});

	it("keeps a title without backticks as one text part", () => {
		expect(titleParts("Plain Title")).toEqual([{ text: "Plain Title", code: false }]);
	});

	it("leaves an unpaired backtick as literal text", () => {
		expect(titleParts("`code` then a stray ` here")).toEqual([
			{ text: "code", code: true },
			{ text: " then a stray ` here", code: false },
		]);
	});
});

describe("plainTitle", () => {
	it("drops the backticks around code spans", () => {
		expect(plainTitle("Ignored `AGENTS.md`. `x` too")).toBe("Ignored AGENTS.md. x too");
	});
});
