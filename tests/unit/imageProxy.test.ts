import { describe, expect, it } from 'vitest';
import { isAllowedImageHost, resolveProxiedTarget, toProxiedImageUrl } from '$lib/utils/imageProxy';

describe('imageProxy', () => {
	it('放行 lain 主机并生成同源代理地址', () => {
		expect(isAllowedImageHost('https://lain.bgm.tv/pic/cover/s/1.jpg')).toBe(true);
		const proxied = toProxiedImageUrl('https://lain.bgm.tv/pic/cover/s/1.jpg');
		expect(proxied).toBe('/api/img?url=' + encodeURIComponent('https://lain.bgm.tv/pic/cover/s/1.jpg'));
	});

	it('拒绝非允许主机、非法协议与本地引用', () => {
		expect(toProxiedImageUrl('https://evil.example.com/a.jpg')).toBeNull();
		expect(toProxiedImageUrl('ftp://lain.bgm.tv/a.jpg')).toBeNull();
		expect(toProxiedImageUrl('data:image/png;base64,xxx')).toBeNull();
		expect(toProxiedImageUrl('/local.png')).toBeNull();
		expect(toProxiedImageUrl('')).toBeNull();
		expect(toProxiedImageUrl(null)).toBeNull();
		expect(isAllowedImageHost('not a url')).toBe(false);
	});

	it('服务端解析：合法上游原样返回，越权/缺失返回 null', () => {
		expect(resolveProxiedTarget('https://lain.bgm.tv/img/x.png')).toBe('https://lain.bgm.tv/img/x.png');
		expect(resolveProxiedTarget('https://evil.example.com/x.png')).toBeNull();
		expect(resolveProxiedTarget(null)).toBeNull();
	});
});
