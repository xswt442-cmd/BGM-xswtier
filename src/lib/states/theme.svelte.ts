// 双轴视觉：配色轴（color scheme）× 特效轴（effects），两轴独立 $state + 独立持久化，任意组合合法。
export type ColorScheme = 'warm' | 'dark' | 'sky';
export type Effects = 'none' | 'neon';

const SCHEME_KEY = 'bgmtier-scheme';
const EFFECTS_KEY = 'bgmtier-effects';
const SCHEMES: ColorScheme[] = ['warm', 'dark', 'sky'];
const EFFECTS_LIST: Effects[] = ['none', 'neon'];

function loadScheme(): ColorScheme {
	if (typeof localStorage === 'undefined') return 'warm';
	const stored = localStorage.getItem(SCHEME_KEY);
	return SCHEMES.includes(stored as ColorScheme) ? (stored as ColorScheme) : 'warm';
}

function loadEffects(): Effects {
	if (typeof localStorage === 'undefined') return 'none';
	const stored = localStorage.getItem(EFFECTS_KEY);
	return EFFECTS_LIST.includes(stored as Effects) ? (stored as Effects) : 'none';
}

let colorScheme = $state<ColorScheme>(loadScheme());
let effects = $state<Effects>(loadEffects());

// 把两轴类挂到 <html>。只在浏览器调用（prerender 阶段无 document）。
export function applyTheme() {
	const root = document.documentElement;
	root.classList.remove('theme-warm', 'theme-dark', 'theme-sky');
	root.classList.add(`theme-${colorScheme}`);
	root.classList.remove('effects-none', 'effects-neon');
	root.classList.add(`effects-${effects}`);
}

export const theme = {
	get colorScheme() {
		return colorScheme;
	},
	get effects() {
		return effects;
	},
	setColor(c: ColorScheme) {
		colorScheme = c;
		applyTheme();
		localStorage.setItem(SCHEME_KEY, c);
	},
	setEffects(e: Effects) {
		effects = e;
		applyTheme();
		localStorage.setItem(EFFECTS_KEY, e);
	}
};
