# OpenTeams Engineering Blog

Static Astro site for the posts in
[engineering-blog](https://github.com/openteams-ai/engineering-blog).

```bash
npm install
npm run dev          # http://localhost:4321/engineering-blog
npm run build        # dist/
npm test
```

## Posts

```bash
npm run sync-posts -- ../engineering-blog
```

Copies `posts/` into `src/content/posts/`, and writes author profiles and
publication dates to `src/data/`.

For a new post, also add:

- its topic in `src/data/topics.ts`
- card art in `src/components/PostArt.astro`, listed in `BlogThumb.astro`
- a share image: `npm run capture-og -- <slug>` with the dev server running,
  then an entry in `src/data/og-images.json`
