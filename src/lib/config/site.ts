export const PUBLIC_SITE_ORIGIN = 'https://bgm-xswtier.xswt.fyi';

export const LEGACY_PRODUCTION_HOSTS = new Set(['bgm-xswtier.vercel.app', 'bgm-xswtier-seven.vercel.app']);

export function publicTierShareUrl(pathname: string, encodedState: string): string {
	return new URL(`${pathname}#state=${encodedState}`, PUBLIC_SITE_ORIGIN).toString();
}
