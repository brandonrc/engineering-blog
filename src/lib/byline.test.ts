import { describe, expect, it } from "vitest";
import { bylineNames } from "./byline";

const a = (name: string) => ({ name });

describe("bylineNames", () => {
	it("falls back to the team when a post has no known author", () => {
		expect(bylineNames([])).toBe("OpenTeams Engineering");
	});

	it("names a single author", () => {
		expect(bylineNames([a("Alice Smith")])).toBe("Alice Smith");
	});

	it("joins two authors with an ampersand", () => {
		expect(bylineNames([a("Alice Smith"), a("Bob Jones")])).toBe("Alice Smith & Bob Jones");
	});

	it("lists three or more authors with commas and a final ampersand", () => {
		expect(bylineNames([a("Alice"), a("Bob"), a("Carol")])).toBe("Alice, Bob & Carol");
	});
});
