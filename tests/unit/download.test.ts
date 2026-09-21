import { describe, expect, it } from 'vitest';
import { compactStamp, dateStamp } from '$lib/utils/download';

describe('download stamps', () => {
	it('dateStamp 输出 YYYY-MM-DD', () => {
		expect(dateStamp(new Date('2026-09-21T10:30:00Z'))).toBe('2026-09-21');
	});

	it('compactStamp 输出 YYYYMMDDHHMM，精确到分钟', () => {
		expect(compactStamp(new Date('2026-09-21T10:30:00Z'))).toBe('202609211030');
	});

	it('compactStamp 同一天不同分钟不重名——图片导出靠它区分多份', () => {
		const a = compactStamp(new Date('2026-09-21T10:30:00Z'));
		const b = compactStamp(new Date('2026-09-21T10:31:00Z'));
		expect(a).not.toBe(b);
	});
});
