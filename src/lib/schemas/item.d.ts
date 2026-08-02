// 领域模型：BGM 条目 + tier 等级行（MVP 仅动画条目）

export type ItemCategory = 'subject';

export type ItemIdentity = {
	bgm_id: number;
	category: ItemCategory;
};

export type ItemData = ItemIdentity & {
	/** dnd 唯一 key：`${category}:${bgm_id}`（如 subject:123） */
	id: string;
	name: string;
	name_cn?: string;
	/** 封面（images.small） */
	image?: string;
	/** 均分 rating.score（0..10） */
	score?: number;
	rating_total?: number;
	eps?: number;
	/** 播出日期 YYYY-MM-DD */
	air_date?: string;
	/** 分类 platform（'TV'|'WEB'|'OVA'|'剧场版'|'动态漫画'）→ 客户端二次过滤 */
	platform?: string;
	/** BGM meta_tags（来源/类型/地区），今日更新按「日本」过滤用 */
	meta_tags?: string[];
	/** svelte-dnd-action 拖拽中插入的 shadow 占位符标记（必须过滤，勿持久化） */
	isDndShadowItem?: boolean;
};

export interface TierDef {
	/** crypto.randomUUID()，dnd key 稳定不随下标漂移 */
	id: string;
	label: string;
	/** "var(--chart-1)" 或自定义 "#ff3366" */
	color: string;
	items: ItemData[];
}

export type TierStore = {
	version: 1;
	tiers: TierDef[];
	/** 未排名条目池（sidebar） */
	collectionTierItems: ItemData[];
};

export type TierDraft = TierStore & {
	savedAt: string;
};
