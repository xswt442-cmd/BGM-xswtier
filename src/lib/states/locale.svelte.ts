import { baseLocale, isLocale, locales, overwriteGetLocale } from '$lib/paraglide/runtime';

type Locale = (typeof locales)[number];

const STORAGE_KEY = 'bgmtier-locale';

function loadLocale(): Locale {
	if (typeof localStorage === 'undefined') return baseLocale;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored && isLocale(stored) ? stored : baseLocale;
}

let current = $state<Locale>(loadLocale());

// 让所有 m.*() 消息函数读到 $state → 语言切换即时生效，无需整页跳转
overwriteGetLocale(() => current);

export const locale = {
	get current() {
		return current;
	},
	set(l: string) {
		if (!isLocale(l)) return;
		current = l;
		localStorage.setItem(STORAGE_KEY, l);
		if (typeof document !== 'undefined') document.documentElement.lang = l;
	}
};
