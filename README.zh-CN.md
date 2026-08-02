**Language:** [English](README.md) | [简体中文](README.zh-CN.md)

---

# BGM-xswtier

Bangumi 动漫 Tier 排名工具。支持关键词搜索、按目录 ID / 用户名加载条目，拖拽到各档位排名，排名自动保存在本地浏览器，无需后端。

[![License: MIT](https://img.shields.io/github/license/xswt442-cmd/BGM-xswtier)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-bgm--xswtier-black?logo=vercel&logoColor=white)](https://bgm-xswtier.vercel.app/)
[![Framework](https://img.shields.io/badge/SvelteKit-5-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)

## 功能特性

- **灵活搜索** —— 关键词 + 区域 / 分类 / 来源 / 类型 / 标签 / 开播时间 / 评分 / 评分人数筛选，结果可批量加入排名池。
- **快捷入口** —— 一键查看本季在播与本日更新。
- **目录 / 用户加载** —— 按目录 ID 排名目录内条目，或按用户名排名 TA 的收藏。
- **拖拽排名** —— 档位可改名 / 改色 / 删除、字号可调，排名持久化到 localStorage。
- **会话管理** —— 暂存草稿、暂存并退出、清空会话，成品可导出为 2× PNG。
- **三轴视觉系统** —— 配色（暖阳 / 黑夜 / 蓝天）× 特效（霓虹 / CRT）× 界面反馈（街机 / 呼吸），任意组合。
- **中英双语** —— 界面即时切换简体中文 / English。
- **隐私友好** —— 数据全部留在浏览器；可选的 Bangumi access token 用于提高 API 限流额度。

## 快速开始

**环境要求：** Node.js ≥ 20.19 与 pnpm。

```bash
pnpm install   # 安装依赖
pnpm dev       # 本地开发 http://localhost:5173
pnpm check     # svelte-check 类型检查
pnpm build     # 生产构建
```

## 使用说明

1. 首页点击 `CLICK TO START` 进入。
2. 搜索条目，或输入目录 ID / 用户名。
3. 拖拽条目到各档位，排名自动保存。

> **访问令牌：** 在设置中填写 Bangumi access token（<https://next.bgm.tv/demo/access-token>）可提高 API 限流额度；不填则以匿名身份访问。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | SvelteKit · Svelte 5 (runes) |
| 样式 | Tailwind CSS v4 · @iconify/tailwind4 · tw-animate-css |
| UI 组件 | bits-ui / shadcn-svelte |
| 国际化 | Paraglide JS（`messages/en.json`、`messages/zh.json`） |
| 数据 | openapi-fetch · @tanstack/svelte-query · p-limit |
| 拖拽 | svelte-dnd-action |
| 持久化 | svelte-persisted-store（localStorage） |
| 部署 | @sveltejs/adapter-vercel |

## 部署

推送 `main` 分支触发 Vercel 自动部署；日常开发在 `dev` 分支进行。

## 许可证

[MIT](LICENSE) © 2026 PracticalIssue
