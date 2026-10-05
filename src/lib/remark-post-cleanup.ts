import { pageUrl } from "./blog-path";
import { cleanupPost } from "./post-cleanup";

/** Remark plugin wrapper around cleanupPost (title comes from frontmatter). */
export default function remarkPostCleanup() {
	return (tree: Parameters<typeof cleanupPost>[0], file: { data: { astro?: { frontmatter?: { title?: string } } } }) => {
		cleanupPost(tree, file.data.astro?.frontmatter?.title ?? "", (slug) => pageUrl(`/${slug}`));
	};
}
