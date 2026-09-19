# Agent guide

BGM-xswtier is an anime tier-list builder for Bangumi: load entries by keyword, index
ID, or username, then drag them into tiers. Ranking data lives in the browser — there
is no account, no database, and no application backend. That constraint is
load-bearing, and it decides most of the "do not" rules below.

## Workflow

- Develop on `dev`. Pushing `main` deploys, so treat `dev -> main -> push` as a
  deployment action that needs an explicit request.
- Commit subjects: capitalized type plus a Chinese summary (`Feat:`, `Fix:`, `Docs:`).
- Commit with `git commit --only <paths>` — never `git add -A`.
- Do not commit, push, or tag unless asked.
- `testplace/` is ignored scratch (records, measurements, handoff notes), with
  `WORKLOG.md` as the running log. Version control cannot show changes to it, so read
  the tail rather than trusting `git status`.
- Pre-push runs `pnpm check` and `pnpm test:unit` only. E2E and build belong to CI,
  which is also the only gate that sees the real deployment artifact. A blocking hook
  cannot host Playwright: its server teardown is unreliable and can stall the push.

## Engineering

- **Server code exists only to bypass CORS** (`src/routes/api/`): an image proxy (lain
  CDN sends no CORS headers, and exports lose their covers without it), error
  reporting, and a relay for the p1 API. These endpoints are stateless, hold no data,
  and have no users. When another is needed, add a `+server.ts` — **do not introduce a
  second runtime for them.**
- **`localStorage` is the only source of truth.** Share links carry their entire
  payload in the URL and never re-query the API, so a link keeps working without the
  session that produced it. The serializer has two consumers — URL and JSON — and both
  must be considered together.
- **Layering is load-bearing.** `api/` goes through the shared client, never a bare
  `fetch`: token injection and default request timeouts live there. `utils/` stays pure
  — no runes, no imports from the state layer — because the serializer is called from
  both the URL and the JSON paths.
- **API types are hand-maintained.** The official schema sits in gitignored
  `dev-docs/`, so there is no generator to lean on; sync the types by hand when an
  endpoint changes.
- **Chinese and English messages stay in step** — nothing enforces it.
- **Drag and drop fails silently, so these hold:**
  - Never put a native `<button>` inside a dndzone item; that item stops dragging. Use
    `span[role="button"]` with keyboard handlers.
  - Item identity attributes belong to the zone's wrapper elements. Do not add a second
    one inside the card — E2E counts them exactly.
  - Shadow placeholders are filtered in the persistence layer, never in the drag
    handlers, or real items are lost across containers.
- **The visual system is three independent axes** — color, ambient VFX, interaction
  feedback — freely combinable. Do not merge them.
- **Offline is a design constraint**: fonts are self-hosted, never linked externally.
- UI copy uses the name `BGM-xswtier`; the Chinese term is 动漫, not 番剧.
- Responsive is a requirement rather than a polish pass: multi-column on desktop,
  drawer on tablet, single column on phone. Rounded corners and soft shadows, never
  heavy black outlines.
- **Do not add features freely.** This is a personal tool, and "your data stays in your
  browser" is the reason it exists.

## Verify

```sh
pnpm check
pnpm test:unit
pnpm format:check
pnpm build
pnpm test:e2e
```

- Static checks suffice for CSS and copy. Layout, drag and drop, persistence, and core
  flows need E2E.
- State what was skipped instead of implying it passed.
