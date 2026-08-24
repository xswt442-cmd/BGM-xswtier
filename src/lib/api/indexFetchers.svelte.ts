import pLimit from 'p-limit';
import { pubClient } from './clients.svelte';
import type { ItemIdentity } from '$lib/schemas/item';

type IndexPage = { total: number; data: { id: number }[] };

// 统一走 pubClient（修复 legacy 裸 fetch 异味）。
// 官方 spec 该端点 200 无 content schema，data cast 到本地 IndexPage。
export async function fetchIndexById(index_id: number): Promise<ItemIdentity[] | undefined> {
	const limit = 50;
	const items: ItemIdentity[] = [];

	const { data: firstRaw, error } = await pubClient.GET('/v0/indices/{index_id}/subjects', {
		params: { path: { index_id }, query: { limit, offset: 0 } }
	});
	if (error) return undefined;
	const firstPage = firstRaw as unknown as IndexPage | undefined;
	if (!firstPage) return undefined;

	const total = firstPage.total ?? 0;
	for (const s of firstPage.data ?? []) {
		if (s.id) items.push({ bgm_id: s.id, category: 'subject' });
	}

	if (total > limit) {
		const pageCount = Math.ceil(total / limit) - 1;
		// 并发压制防 429；个别页失败跳过（p?.data ?? [] 兜底），不整体作废
		const plimit = pLimit(4);
		const pages = await Promise.all(
			Array.from({ length: pageCount }, (_, i) =>
				plimit(() =>
					pubClient
						.GET('/v0/indices/{index_id}/subjects', {
							params: { path: { index_id }, query: { limit, offset: (i + 1) * limit } }
						})
						.then((r) => r.data as unknown as IndexPage | undefined)
				)
			)
		);
		for (const p of pages) {
			for (const s of p?.data ?? []) {
				if (s.id) items.push({ bgm_id: s.id, category: 'subject' });
			}
		}
	}
	return items;
}
