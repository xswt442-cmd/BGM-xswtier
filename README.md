# BGM-xswtier

Bangumi 动漫 tier 排名工具：搜索关键词、输入 BGM 目录 ID 或用户名，加载条目，拖拽排名，自动保存本地。

项目网址：[BGM-xswtier](https://bgm-xswtier.vercel.app/)

## 功能

- **搜索**：关键词 + 区域 / 分类 / 来源 / 类型 / 标签 / 开播时间 / 评分 / 评分人数筛选，结果可批量加入排名池
- **快捷入口**：本季在播、本日更新
- **目录 / 用户名**：输入 BGM 目录 ID 给目录条目排名，或输入用户名给 TA 的收藏排名
- **拖拽排名**：多档自由拖拽，档位改名 / 改色 / 删档 / 自定义字号，排名持久化到 localStorage
- **双轴视觉**：配色（暖阳 / 黑夜 / 蓝天）× 特效（无 / 霓虹灯）任意组合
- **i18n**：中文 / English 即时切换

## 本地构建

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # svelte-check 类型检查
pnpm build      # 生产构建（adapter-vercel）
```

## 使用

1. 首页点击 `CLICK TO START`
2. 搜索动画，或输入目录 ID / 用户名加载条目
3. 拖拽条目到各 tier 档位，排名自动保存在浏览器 localStorage

> API token 由用户自行在设置中填写（<https://next.bgm.tv/demo/access-token>），用于提高 Bangumi API 限流额度；不填则以匿名身份访问。

## 技术栈

SvelteKit + Svelte 5 (runes) · Tailwind CSS v4 · Paraglide JS (i18n) · openapi-fetch · svelte-dnd-action · svelte-persisted-store · bits-ui / shadcn-svelte · Fusion Pixel 自托管中文字体

## 部署

推送 `main` 分支触发 Vercel 自动部署；日常开发在 `dev` 分支进行。
