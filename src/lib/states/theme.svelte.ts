// 三轴视觉：配色 × VFX × UIFB。三轴独立持久化，可任意组合；VFX/UIFB 各自内部互斥。
export type ColorScheme = 'sun' | 'dark' | 'sky';
export type VisualEffects = 'none' | 'neon' | 'crt';
export type UiFeedback = 'none' | 'arcade' | 'pulse';

const SCHEME_KEY = 'bgmtier-scheme';
const LEGACY_EFFECTS_KEY = 'bgmtier-effects';
const VFX_KEY = 'bgmtier-vfx';
const UIFB_KEY = 'bgmtier-uifb';
const SCHEMES: ColorScheme[] = ['sun', 'dark', 'sky'];
const VFX_LIST: VisualEffects[] = ['none', 'neon', 'crt'];
const UIFB_LIST: UiFeedback[] = ['none', 'arcade', 'pulse'];

function loadScheme(): ColorScheme {
	if (typeof localStorage === 'undefined') return 'sun';
	const stored = localStorage.getItem(SCHEME_KEY);
	return SCHEMES.includes(stored as ColorScheme) ? (stored as ColorScheme) : 'sun';
}

function loadVfx(): VisualEffects {
	if (typeof localStorage === 'undefined') return 'none';
	const stored = localStorage.getItem(VFX_KEY) ?? localStorage.getItem(LEGACY_EFFECTS_KEY);
	return VFX_LIST.includes(stored as VisualEffects) ? (stored as VisualEffects) : 'none';
}

function loadUiFeedback(): UiFeedback {
	if (typeof localStorage === 'undefined') return 'none';
	const stored = localStorage.getItem(UIFB_KEY) ?? localStorage.getItem(LEGACY_EFFECTS_KEY);
	return UIFB_LIST.includes(stored as UiFeedback) ? (stored as UiFeedback) : 'none';
}

let colorScheme = $state<ColorScheme>(loadScheme());
let visualEffects = $state<VisualEffects>(loadVfx());
let uiFeedback = $state<UiFeedback>(loadUiFeedback());

// 把两轴类挂到 <html>。只在浏览器调用（prerender 阶段无 document）。
export function applyTheme() {
	const root = document.documentElement;
	root.classList.remove('theme-sun', 'theme-dark', 'theme-sky');
	root.classList.add(`theme-${colorScheme}`);
	root.classList.remove('effects-none', 'effects-neon', 'effects-crt');
	root.classList.add(`effects-${visualEffects}`);
	root.classList.remove('feedback-none', 'feedback-arcade', 'feedback-pulse');
	root.classList.add(`feedback-${uiFeedback}`);
}

export const theme = {
	get colorScheme() {
		return colorScheme;
	},
	get effects() {
		return visualEffects;
	},
	get uiFeedback() {
		return uiFeedback;
	},
	setColor(c: ColorScheme) {
		colorScheme = c;
		applyTheme();
		localStorage.setItem(SCHEME_KEY, c);
	},
	setEffects(e: VisualEffects) {
		visualEffects = e;
		applyTheme();
		localStorage.setItem(VFX_KEY, e);
	},
	setUiFeedback(feedback: UiFeedback) {
		uiFeedback = feedback;
		applyTheme();
		localStorage.setItem(UIFB_KEY, feedback);
	},
};
