import { describe, expect, it } from "vitest";
import { parseAuthors } from "./authors";

const YML = `# Author Registry
authors:
  - name: Alice Example
    slug: alice
    email: alice@example.com
    bio: >-
      Engineer at Example. Works on
      compilers.
    avatar_url: https://example.com/alice.png

  - name: Bob Example
    slug: bob
    email: bob@example.com
`;

describe("parseAuthors", () => {
	it("keeps public profile fields and never the email", () => {
		expect(parseAuthors(YML)).toEqual([
			{
				slug: "alice",
				name: "Alice Example",
				bio: "Engineer at Example. Works on compilers.",
				avatarUrl: "https://example.com/alice.png",
			},
			{ slug: "bob", name: "Bob Example", bio: "", avatarUrl: null },
		]);
	});
});
