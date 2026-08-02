# BGM-xswtier

**An anime tier-list builder for Bangumi** — search by keyword, or load a Bangumi index ID / username, then drag-and-drop titles into ranked tiers. Everything is saved locally in your browser.

**Bangumi 动漫 Tier 排名工具** —— 关键词搜索、按目录 ID / 用户名加载条目，拖拽到各档位排名，排名自动保存在本地浏览器。

[![License: MIT](https://img.shields.io/github/license/xswt442-cmd/BGM-xswtier)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-bgm--xswtier-black?logo=vercel&logoColor=white)](https://bgm-xswtier.vercel.app/)
[![Framework](https://img.shields.io/badge/SvelteKit-5-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)

---

## Features / 功能特性

| English | 中文 |
|---|---|
| Keyword search with filters: region, category, source, type, tags, air date, rating, rating count | 关键词搜索，支持区域 / 分类 / 来源 / 类型 / 标签 / 开播时间 / 评分 / 评分人数筛选 |
| Quick entries for this season and today's updates | 「本季在播」「本日更新」快捷入口 |
| Load a Bangumi index by ID, or a user's collection by username | 按目录 ID 加载条目，或按用户名加载 TA 的收藏 |
| Drag-and-drop ranking: rename / recolor / delete tiers, adjustable tier label size | 多档自由拖拽排名，档位可改名 / 改色 / 删除，字号可调 |
| Draft the session, exit-and-resume, and export the finished tier as a 2× PNG | 暂存草稿、暂存并退出、2× PNG 导出成品 |
| Three-axis visual system: color scheme × VFX × UI feedback, freely combinable | 三轴视觉系统：配色 × 特效 × 界面反馈，任意组合 |
| Bilingual UI (中文 / English), instant switch | 中英双语界面，即时切换 |
| No backend — rankings persist to localStorage | 无后端，排名持久化到 localStorage |

## Getting Started / 快速开始

Requires Node.js ≥ 20.19 and pnpm.

需要 Node.js ≥ 20.19 与 pnpm。

```bash
pnpm install    # install dependencies / 安装依赖
pnpm dev        # dev server at http://localhost:5173 / 本地开发
pnpm build      # production build / 生产构建
pnpm check      # svelte-check type check / 类型检查
```

## Usage / 使用说明

1. Click `CLICK TO START` on the landing page. / 首页点击 `CLICK TO START` 进入。
2. Search titles, or enter an index ID / username. / 搜索条目，或输入目录 ID / 用户名。
3. Drag titles into tier rows — the ranking is saved automatically. / 拖拽条目到各档位，排名自动保存。

> **Access token** / **访问令牌**：enter a Bangumi access token in Settings (<https://next.bgm.tv/demo/access-token>) to raise the API rate limit; anonymous access works otherwise. 在设置中填写 Bangumi access token（链接见上）可提高 API 限流额度；不填则以匿名身份访问。

## Tech Stack / 技术栈

| Layer / 层 | Tech / 技术 |
|---|---|
| Framework | SvelteKit + Svelte 5 (runes) |
| Styling | Tailwind CSS v4 · @iconify/tailwind4 · tw-animate-css |
| UI | bits-ui / shadcn-svelte |
| i18n | Paraglide JS (`messages/en|zh.json`) |
| Data | openapi-fetch · @tanstack/svelte-query · p-limit |
| Drag & drop | svelte-dnd-action |
| Persistence | svelte-persisted-store (localStorage) |
| Deploy | @sveltejs/adapter-vercel |

## Deploy / 部署

Pushing the `main` branch triggers automatic deployment to Vercel; daily development happens on the `dev` branch.

推送 `main` 分支触发 Vercel 自动部署；日常开发在 `dev` 分支进行。

## License / 许可证

[MIT](LICENSE) © 2026 PracticalIssue
