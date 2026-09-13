import { describe, expect, it } from 'vitest';
import { publicTierShareUrl } from '../../src/lib/config/site';

describe('public site URLs', () => {
	it('always builds portable tier links on the official origin', () => {
		expect(publicTierShareUrl('/tier', 'abc-123')).toBe('https://bgm-xswtier.xswt.fyi/tier#state=abc-123');
	});
});
