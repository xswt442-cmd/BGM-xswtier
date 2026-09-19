import { beforeEach, describe, expect, it, vi } from 'vitest';

// pubClient 是 openapi-fetch 生成的客户端；这里只关心 GET 的返回约定
const GET = vi.fn();
vi.mock('$lib/api/clients.svelte', () => ({
	pubClient: { GET: (...args: unknown[]) => GET(...args) },
}));

const { fetchSubject, subjectLikeToItemData } = await import('$lib/api/bgmFetchers.svelte');

beforeEach(() => {
	GET.mockReset();
});

describe('subjectLikeToItemData', () => {
	it('无 id 时返回 undefined（调用方据此判空）', () => {
		expect(subjectLikeToItemData({ id: 0 } as never)).toBeUndefined();
	});

	it('SlimSubject 顶层 score 与 Subject 的 rating.score 都能取到', () => {
		expect(subjectLikeToItemData({ id: 1, name: 'A', score: 8.2 } as never)?.score).toBe(8.2);
		expect(subjectLikeToItemData({ id: 2, name: 'B', rating: { score: 7.1, total: 99 } } as never)).toEqual(
			expect.objectContaining({ score: 7.1, rating_total: 99, id: 'subject:2' }),
		);
	});
});

describe('fetchSubject', () => {
	// 回归：曾写成 `if (error || !data) return undefined`，把失败伪装成"成功但无数据"。
	// 虽然 TanStack Query 5 会对 undefined 兜底抛错，但那是隐式依赖；这里要求显式抛错，
	// 让 BatchLoader 的失败归类不依赖第三方库的实现细节。
	it('HTTP error 时抛错，而不是返回 undefined', async () => {
		GET.mockResolvedValue({ error: { title: 'Not Found' }, data: undefined });
		await expect(fetchSubject(999)).rejects.toThrow(/999/);
	});

	it('data 缺失（无 id）时抛错', async () => {
		GET.mockResolvedValue({ error: undefined, data: {} });
		await expect(fetchSubject(1)).rejects.toThrow();
	});

	it('成功时映射为 ItemData', async () => {
		GET.mockResolvedValue({ error: undefined, data: { id: 12, name: 'Steins;Gate', score: 9.1 } });
		await expect(fetchSubject(12)).resolves.toEqual(
			expect.objectContaining({ id: 'subject:12', bgm_id: 12, name: 'Steins;Gate', score: 9.1 }),
		);
	});
});
