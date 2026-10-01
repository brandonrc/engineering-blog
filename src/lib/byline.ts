/** Every author of a post as one line: "A", "A & B", "A, B & C". */
export function bylineNames(authors: { name: string }[]): string {
	const names = authors.map((a) => a.name);
	if (!names.length) return "OpenTeams Engineering";
	if (names.length === 1) return names[0];
	return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}
