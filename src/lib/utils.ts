import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** 返回 incoming 中 base 里尚不存在的条目（按 id），保持原有顺序。 */
export function freshById<T extends { id: string }>(base: T[], incoming: T[]): T[] {
	const seen = new Set(base.map((i) => i.id));
	return incoming.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}
