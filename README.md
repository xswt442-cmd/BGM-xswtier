# BGM-xswtier

Bangumi 动漫 tier 排名工具：输入 BGM 目录 ID 或用户名，加载条目，拖拽排名，自动保存到本地。

8-bit 复古游戏风（复古开机屏 + 像素字体 + 像素图标），支持三套主题配色 × 霓虹特效自由组合，中英双语。

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # svelte-check 类型检查
pnpm build      # 生产构建（adapter-vercel）
```

## 使用

1. 首页点击 `CLICK TO START`
2. 输入目录 ID（如 `44847`）或用户名（如 `sai`）
3. 拖拽条目到各 tier 档位，排名自动保存在浏览器 localStorage

> API token 由用户自行在设置中填写（`https://next.bgm.tv/demo/access-token`），用于提高 Bangumi API 限流额度。

## 技术栈

SvelteKit + Svelte 5 (runes) · Tailwind CSS v4 · Paraglide JS (i18n) · openapi-fetch · svelte-dnd-action · svelte-persisted-store · bits-ui / shadcn-svelte

## 部署

推 `main` 分支 → Vercel 自动部署（adapter-vercel）。
