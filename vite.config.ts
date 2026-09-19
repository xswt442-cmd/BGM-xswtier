import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

// adapter-vercel 打包 serverless function 时，对 pnpm 的软链依赖会创建「悬空目录符号链接」
// （先建链接、真身稍后建）。Linux 允许悬空链接，Windows 的 CreateSymbolicLink 要求目标已存在，
// 因此本地 Windows 构建必然在 closeBundle 阶段 ENOENT 失败：
//   symlink '.pnpm\clsx@...\node_modules\clsx' -> '.vercel/output/functions/![-]/catchall.func/node_modules/clsx'
// CI / Vercel 跑 Linux，不受影响。
// 设 SKIP_VERCEL_ADAPTER=1 可跳过 adapter 阶段：SvelteKit 只提示 "No adapter specified"，
// 仍产出完整的 .svelte-kit/output，足以支撑 vite preview 与本地 Playwright E2E。
// 默认（含 CI / Vercel）仍走 adapter-vercel，构建产物与线上完全一致。
const skipVercelAdapter = process.env.SKIP_VERCEL_ADAPTER === '1';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
			},
			// 部署走 Vercel（REBUILD.md Deployment 章节决定），零配置自动部署
			adapter: skipVercelAdapter ? undefined : adapter(),
		}),
		tailwindcss(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// 纯客户端 SPA，不用 url 策略（与静态托管冲突）
			strategy: ['cookie', 'baseLocale'],
		}),
	],
});
