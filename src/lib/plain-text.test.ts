import { describe, expect, it } from "vitest";
import { plainText } from "./plain-text";

describe("plainText", () => {
	it("keeps the words of a markdown body and drops code, images, markup and HTML", () => {
		const md = [
			"## A heading",
			"Some **bold** and _italic_ text with a [link](https://example.com) and `code`.",
			"![Alt text](images/p/a.png)",
			'<img src="images/p/b.png" alt="B">',
			"```python",
			"secret = 1",
			"```",
			"- a list item",
		].join("\n");
		expect(plainText(md)).toBe("A heading Some bold and italic text with a link and code. a list item");
	});

	it("keeps underscores inside identifiers", () => {
		expect(plainText("The tp_as_number slot, _emphasised_.")).toBe("The tp_as_number slot, emphasised.");
	});
});
