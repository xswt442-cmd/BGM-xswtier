import type { ItemData, TierStore } from '$lib/schemas/item';

// 文本导出：bgm 小组发帖（Markdown / BBCode）场景。
// 条目名统一做方括号中性化，避免内容里的 [ ] 破坏 BBCode 标签或 Markdown 链接语法。

const subjectUrl = (item: ItemData): string => `https://bgm.tv/subject/${item.bgm_id}`;
const displayName = (i: ItemData): string => (i.name_cn || i.name).replace(/[[\]]/g, ' ');
const scoreTag = (i: ItemData): string => (i.score !== undefined ? ` ★${i.score.toFixed(1)}` : '');

/** Markdown：每档一个二级标题 + 有序列表；空档只出标题不占位 */
export function toMarkdown(store: TierStore): string {
	const lines: string[] = ['# Tier List', ''];
	for (const tier of store.tiers) {
		lines.push(`## ${tier.label.replace(/#/g, '＃')}`, '');
		tier.items.forEach((item, idx) => {
			lines.push(`${idx + 1}. [${displayName(item)}](${subjectUrl(item)})${scoreTag(item)}`);
		});
		lines.push('');
	}
	return `${lines.join('\n').trimEnd()}\n`;
}

/** BBCode：每档一个加粗行头 + 每行一条带链接条目 */
export function toBBCode(store: TierStore): string {
	const out: string[] = [];
	for (const tier of store.tiers) {
		out.push(`[b]${tier.label.split('[').join('［')}[/b]`);
		for (const item of tier.items) {
			out.push(`[url=${subjectUrl(item)}]${displayName(item)}[/url]${scoreTag(item)}`);
		}
		out.push('');
	}
	return `${out.join('\n').trimEnd()}\n`;
}
