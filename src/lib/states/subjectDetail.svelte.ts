import type { ItemData } from '$lib/schemas/item';
import type { Subject } from '$lib/schemas/bgm-public-api';
import { fetchSubjectDetail } from '$lib/api/bgmFetchers.svelte';

/**
 * 条目详情浮层状态。
 *
 * 与 tierData 的关系：**完全只读**。详情只用于展示，不写回 ItemData / localStorage ——
 * summary、rating.count、collection 这些字段体积大且与排名无关，塞进持久化会同时拖累
 * localStorage 配额和分享链接长度。
 *
 * 挂在 +layout 上，任意页面的 ItemCard 都能触发，不必各页各挂一份。
 */

let target = $state<ItemData | null>(null);
let detail = $state<Subject | null>(null);
let loading = $state(false);
let failed = $state(false);

/**
 * 竞态序号：快速连点不同条目时，先发的请求可能后到。
 * 只认最后一次 open 的结果，其余丢弃；close 也会自增让在途请求失效。
 */
let requestSeq = 0;

export const subjectDetail = {
	/** 注意：不能用 `open` 作名字——对象里同名属性会覆盖下面的 open() 方法，浮层会常开 */
	get isOpen() {
		return target !== null;
	},
	/** 触发条目：先用列表里已有的 ItemData 立即渲染骨架，详情异步补上 */
	get target() {
		return target;
	},
	get detail() {
		return detail;
	},
	get loading() {
		return loading;
	},
	/** 详情请求失败（限流 / 断网），浮层仍可显示基础信息 */
	get failed() {
		return failed;
	},

	async open(item: ItemData) {
		target = item;
		detail = null;
		failed = false;
		loading = true;

		const seq = ++requestSeq;
		const data = await fetchSubjectDetail(item.bgm_id);
		if (seq !== requestSeq) return; // 已切到别的条目或已关闭，丢弃

		loading = false;
		if (data) detail = data;
		else failed = true;
	},

	close() {
		requestSeq += 1; // 让在途请求的结果失效，避免关闭后又把内容填回来
		target = null;
		detail = null;
		loading = false;
		failed = false;
	},
};
