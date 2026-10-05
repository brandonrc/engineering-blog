/**
 * URL path the blog is served under. Every page and file lives below it,
 * so one route (openteams.com<BLOG_PATH>*) serves the whole site.
 */
export const BLOG_PATH = "/engineering-blog";

/** Absolute URL path for a file inside the blog. */
export const blogUrl = (path = "") => `${BLOG_PATH}${path}`;

/**
 * Absolute URL path for a page inside the blog; no argument is the blog's
 * home. Pages are served with a trailing slash and asking without one costs
 * a redirect, so every link to a page carries it.
 */
export const pageUrl = (path = "") => `${BLOG_PATH}${path}/`;
