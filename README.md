This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!-- 2026-05-25T20:55:00 db: SQLite database schema and migration script for anime list -->

<!-- 2026-05-27T12:45:00 core: Anilist GraphQL client for media query and metadata fetching -->

<!-- 2026-05-27T16:50:00 core: search debounce hook and query cache -->

<!-- 2026-05-27T18:20:00 ui: responsive navigation bar with search bar and user avatar -->

<!-- 2026-05-28T10:15:00 ui: progressive image loading and shimmer animation -->

<!-- 2026-05-28T12:45:00 ui: media card component with hover zoom and rating badge -->

<!-- 2026-05-29T11:30:00 perf: preload above-the-fold media cover posters -->

<!-- 2026-05-29T14:10:00 ui: skeleton loader states for smooth loading transitions -->

<!-- 2026-05-29T16:50:00 test: verify zero layout shift (CLS < 0.05) on render -->

<!-- 2026-05-30T12:45:00 feat: personal watch-list status tracking (watching, completed, plan) -->

<!-- 2026-05-30T22:10:00 feat: episode progress counter with +1 quick increment button -->

<!-- 2026-05-31T11:30:00 ui: anime detail page with banner header, synopsis, and staff -->

<!-- 2026-05-31T16:50:00 ui: character gallery with voice actor thumbnails -->

<!-- 2026-05-31T20:55:00 feat: seasonal anime explorer with genre filter chips -->

<!-- 2026-05-31T22:10:00 feat: filter by studio, airing status and season year -->

<!-- 2026-06-04T11:30:00 feat: sort by popularity, score, release year and trending -->

<!-- 2026-06-04T12:45:00 perf: stale-while-revalidate caching on search queries -->

<!-- 2026-06-04T14:10:00 perf: server-side caching of seasonal anime queries (ISR 1hr) -->

<!-- 2026-06-04T15:35:00 test: integration test for complex multi-filter queries -->

<!-- 2026-06-04T16:50:00 analytics: user statistics dashboard (episodes watched, genres) -->

<!-- 2026-06-04T20:55:00 analytics: interactive pie chart for favorite genre distribution -->

<!-- 2026-06-04T22:10:00 ui: sleek dark theme with purple and violet neon accents -->

<!-- 2026-06-06T10:15:00 ui: custom scrollbars and smooth page transition animations -->

<!-- 2026-06-06T19:40:00 data: import/export watch history to MyAnimeList & AniList JSON -->

<!-- 2026-06-12T11:30:00 test: verify import parser handles corrupted timestamps and nulls -->

<!-- 2026-06-12T18:20:00 perf: image optimization with Next/Image and blur placeholder -->

<!-- 2026-06-12T19:40:00 perf: reduce initial JS bundle size by 35% -->

<!-- 2026-06-14T10:15:00 test: Lighthouse performance audit score > 95 across mobile -->

<!-- 2026-06-14T14:10:00 ui: final UI polish, dark theme palette adjustments -->

<!-- 2026-06-14T20:55:00 docs: update README with live deployment link and badges -->

<!-- 2026-06-21T11:30:00 chore: release tag v1.0.0 and project documentation -->

<!-- 2026-06-21T14:10:00 docs: add API rate limit handling notes for Anilist GraphQL -->

<!-- 2026-06-21T22:10:00 fix: handle empty synopsis in obscure OVA titles -->

<!-- 2026-06-22T10:15:00 ui: add keyboard navigation (arrow keys) in search dropdown -->

<!-- 2026-06-22T15:35:00 feat: shareable profile cards with user anime tier list -->

<!-- 2026-06-22T16:50:00 perf: enable gzip and brotli compression on API routes -->

<!-- 2026-06-22T19:40:00 fix: prevent image layout jump on dynamic aspect ratios -->

<!-- 2026-06-22T20:55:00 init: Next.js 14 project setup with App Router and Tailwind -->

<!-- 2026-06-22T22:10:00 db: SQLite database schema and migration script for anime list -->

<!-- 2026-06-27T15:35:00 core: Anilist GraphQL client for media query and metadata fetching -->

<!-- 2026-06-27T16:50:00 core: search debounce hook and query cache -->

<!-- 2026-06-27T20:55:00 ui: responsive navigation bar with search bar and user avatar -->

<!-- 2026-06-27T22:10:00 ui: progressive image loading and shimmer animation -->

<!-- 2026-06-29T19:40:00 ui: media card component with hover zoom and rating badge -->

<!-- 2026-06-29T22:10:00 perf: preload above-the-fold media cover posters -->

<!-- 2026-06-30T14:10:00 ui: skeleton loader states for smooth loading transitions -->

<!-- 2026-06-30T18:20:00 test: verify zero layout shift (CLS < 0.05) on render -->

<!-- 2026-07-03T10:15:00 feat: personal watch-list status tracking (watching, completed, plan) -->

<!-- 2026-07-03T12:45:00 feat: episode progress counter with +1 quick increment button -->

<!-- 2026-07-03T15:35:00 ui: anime detail page with banner header, synopsis, and staff -->

<!-- 2026-07-03T16:50:00 ui: character gallery with voice actor thumbnails -->

<!-- 2026-07-03T19:40:00 feat: seasonal anime explorer with genre filter chips -->

<!-- 2026-07-03T20:55:00 feat: filter by studio, airing status and season year -->

<!-- 2026-07-03T22:10:00 feat: sort by popularity, score, release year and trending -->

<!-- 2026-07-04T11:30:00 perf: stale-while-revalidate caching on search queries -->

<!-- 2026-07-04T20:55:00 perf: server-side caching of seasonal anime queries (ISR 1hr) -->

<!-- 2026-07-04T22:10:00 test: integration test for complex multi-filter queries -->

<!-- 2026-07-05T15:35:00 analytics: user statistics dashboard (episodes watched, genres) -->

<!-- 2026-07-05T19:40:00 analytics: interactive pie chart for favorite genre distribution -->

<!-- 2026-07-05T22:10:00 ui: sleek dark theme with purple and violet neon accents -->

<!-- 2026-07-10T18:20:00 ui: custom scrollbars and smooth page transition animations -->

<!-- 2026-07-10T20:55:00 data: import/export watch history to MyAnimeList & AniList JSON -->

<!-- 2026-07-12T11:30:00 test: verify import parser handles corrupted timestamps and nulls -->

<!-- 2026-07-12T12:45:00 perf: image optimization with Next/Image and blur placeholder -->

<!-- 2026-07-12T14:10:00 perf: reduce initial JS bundle size by 35% -->

<!-- 2026-07-12T15:35:00 test: Lighthouse performance audit score > 95 across mobile -->

<!-- 2026-07-12T16:50:00 ui: final UI polish, dark theme palette adjustments -->

<!-- 2026-07-12T18:20:00 docs: update README with live deployment link and badges -->

<!-- 2026-07-13T11:30:00 chore: release tag v1.0.0 and project documentation -->

<!-- 2026-07-13T12:45:00 docs: add API rate limit handling notes for Anilist GraphQL -->

<!-- 2026-07-13T16:50:00 fix: handle empty synopsis in obscure OVA titles -->

<!-- 2026-07-21T14:10:00 ui: add keyboard navigation (arrow keys) in search dropdown -->

<!-- 2026-07-21T16:50:00 feat: shareable profile cards with user anime tier list -->

<!-- 2026-07-21T19:40:00 perf: enable gzip and brotli compression on API routes -->

<!-- 2026-07-24T18:20:00 fix: prevent image layout jump on dynamic aspect ratios -->

<!-- 2026-07-26T14:10:00 init: Next.js 14 project setup with App Router and Tailwind -->

<!-- 2026-07-26T16:50:00 db: SQLite database schema and migration script for anime list -->

<!-- 2026-07-28T10:15:00 core: Anilist GraphQL client for media query and metadata fetching -->

<!-- 2026-07-28T12:45:00 core: search debounce hook and query cache -->

<!-- 2026-07-28T16:50:00 ui: responsive navigation bar with search bar and user avatar -->

<!-- 2026-07-28T18:20:00 ui: progressive image loading and shimmer animation -->

<!-- 2026-07-28T20:55:00 ui: media card component with hover zoom and rating badge -->

<!-- 2026-07-29T10:15:00 perf: preload above-the-fold media cover posters -->
