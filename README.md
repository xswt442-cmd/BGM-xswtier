**Language:** [English](README.md) | [简体中文](README.zh-CN.md)

---

# BGM-xswtier

An anime tier-list builder for Bangumi. Search by keyword, load a Bangumi index ID or username, then drag titles into ranked tiers. Your rankings are saved locally in the browser — no backend required.

[![License: MIT](https://img.shields.io/github/license/xswt442-cmd/BGM-xswtier)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-bgm--xswtier-black?logo=vercel&logoColor=white)](https://bgm-xswtier.vercel.app/)
[![Framework](https://img.shields.io/badge/SvelteKit-5-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)

## Features

- **Flexible search** — keyword plus filters for region, category, source, type, tags, air date, rating, and rating count, with batch-add to the ranking pool.
- **Quick entries** — this season's lineup and today's updates in one click.
- **Index & user loading** — rank the entries of any Bangumi index by ID, or a user's collection by username.
- **Drag-and-drop ranking** — rename, recolor, or delete tiers; adjust the tier label size; everything persists to localStorage.
- **Session management** — save a draft, exit and resume later, or export the finished tier as a 2× PNG.
- **Three-axis visual system** — color scheme (sun / night / sky) × VFX (neon / CRT) × UI feedback (arcade / pulse), freely combinable.
- **Bilingual UI** — Simplified Chinese / English, switched instantly.
- **Privacy-friendly** — all data stays in your browser; an optional Bangumi access token raises the API rate limit.

## Getting Started

**Prerequisites:** Node.js ≥ 20.19 and pnpm.

```bash
pnpm install   # install dependencies
pnpm dev       # dev server at http://localhost:5173
pnpm check     # svelte-check type checking
pnpm build     # production build
```

## Usage

1. Click `CLICK TO START` on the landing page.
2. Search titles, or enter an index ID / username.
3. Drag titles into tier rows — your ranking is saved automatically.

> **Access token:** enter a Bangumi access token in Settings (<https://next.bgm.tv/demo/access-token>) to raise the API rate limit. Anonymous access works without one.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | SvelteKit · Svelte 5 (runes) |
| Styling | Tailwind CSS v4 · @iconify/tailwind4 · tw-animate-css |
| UI components | bits-ui / shadcn-svelte |
| i18n | Paraglide JS (`messages/en.json`, `messages/zh.json`) |
| Data | openapi-fetch · @tanstack/svelte-query · p-limit |
| Drag & drop | svelte-dnd-action |
| Persistence | svelte-persisted-store (localStorage) |
| Deployment | @sveltejs/adapter-vercel |

## Deployment

Pushing the `main` branch triggers automatic deployment to Vercel. Day-to-day development happens on the `dev` branch.

## License

[MIT](LICENSE) © 2026 PracticalIssue
