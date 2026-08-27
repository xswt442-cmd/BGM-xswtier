import { describe, expect, it } from 'vitest';
import type { ItemData, TierDef, TierStore } from '$lib/schemas/item';
import { toBBCode, toMarkdown } from '$lib/utils/tierExportText';

const item = (id: number, name_cn?: string, score?: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `Subject ${id}`,
	...(name_cn ? { name_cn } : {}),
	...(score !== undefined ? { score } : {}),
});

const store = (): TierStore => ({
	version: 1,
	tiers: [
		{ id: 'a', label: '夯', color: 'var(--chart-1)', items: [item(1, '一', 8.7)] },
		{ id: 'b', label: '拉完了', color: 'var(--chart-2)', items: [] },
	] as TierDef[],
	collectionTierItems: [],
});

describe('tierExportText', () => {
	it('Markdown 输出每档标题与带链接有序列表，空档仅出标题', () => {
		const md = toMarkdown(store());
		expect(md).toContain('## 夯');
		expect(md).toContain('1. [一](https://bgm.tv/subject/1) ★8.7');
		expect(md).toContain('## 拉完了');
		expect(md.match(/^\d+\./gm)?.length).toBe(1);
	});

	it('BBCode 输出加粗档名与 url 标签', () => {
		const bb = toBBCode(store());
		expect(bb).toContain('[b]夯[/b]');
		expect(bb).toContain('[url=https://bgm.tv/subject/1]一[/url] ★8.7');
	});

	it('名字里的方括号被中性化，不破坏标记语法', () => {
		const s = store();
		s.tiers[0].items = [item(9, '[X]测试')];
		const md = toMarkdown(s);
		expect(md).toContain('](https://bgm.tv/subject/9)');
		expect(md).not.toContain('[[X]');
		const bb = toBBCode(s);
		expect(bb).toContain('[url=https://bgm.tv/subject/9] X 测试[/url]');
	});
});
