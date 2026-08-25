import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		// 编译 .svelte.ts runes 模块（tierData/itemBatchLoader 等状态层），让单测能直接导入
		svelte({
			compilerOptions: { runes: true },
		}),
	],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
		},
	},
	test: {
		environment: 'happy-dom', // 状态层依赖 localStorage / DOM API
		include: ['tests/unit/**/*.test.ts'],
	},
});
