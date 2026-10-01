import { describe, expect, it } from "vitest";
import { authorRole, bylineNames } from "./byline";

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

describe("authorRole", () => {
	it("takes the first sentence of the bio", () => {
		expect(authorRole({ bio: "Engineer at Example. Writes about tests." })).toBe("Engineer at Example");
	});

	it("falls back to the team when there is no bio", () => {
		expect(authorRole({ bio: "" })).toBe("OpenTeams");
	});
});
