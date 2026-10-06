// Print the PR comment for a preview: its home page plus a link to each post
// file given (the posts the PR adds or edits).
//
//   node scripts/preview-comment.ts https://pr-12-....workers.dev posts/my-post.md ...
import { readFileSync } from "node:fs";
import { previewComment } from "../src/lib/new-posts.ts";

const [origin, ...files] = process.argv.slice(2);
console.log(previewComment(origin, files.map((file) => readFileSync(file, "utf8"))));
