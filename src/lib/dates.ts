import { DATE_ZONE } from "../data/site";

/** A post's date the short way, for cards and search results: "Sep 29, 2026". */
export const shortDate = (date: Date): string =>
	date.toLocaleDateString("en-US", { timeZone: DATE_ZONE, year: "numeric", month: "short", day: "numeric" });
