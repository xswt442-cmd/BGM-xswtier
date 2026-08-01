# BGM-xswtier

Bangumi 动漫 tier 排名工具：输入 BGM 目录 ID 或用户名，加载条目，拖拽排名，保存本地。

项目网址：[BGM-xswtier](https://bgm-xswtier.vercel.app/)

## 本地构建

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # svelte-check 类型检查
pnpm build      # 生产构建（adapter-vercel）
```

## 使用

1. 首页点击 `CLICK TO START`
2. 输入目录 ID 或用户名
3. 拖拽条目到各 tier 档位，排名自动保存在浏览器 localStorage

> API token 由用户自行在设置中填写（`https://next.bgm.tv/demo/access-token`），用于提高 Bangumi API 限流额度。

## 技术栈

SvelteKit + Svelte 5 (runes) · Tailwind CSS v4 · Paraglide JS (i18n) · openapi-fetch · svelte-dnd-action · svelte-persisted-store · bits-ui / shadcn-svelte
