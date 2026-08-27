// 离线壳 service worker（SvelteKit 原生支持：src/service-worker.js → /service-worker.js）。
// 策略：
// - install 预缓存全部构建产物（hashed immutable）与 static 资源（含自托管字体）
// - 导航请求 network-first，离线回退已缓存页面（访问过的路由可离线重开）
// - immutable/静态资源/封面代理 cache-first（内容寻址或长缓存放心吃缓存）
// - /api/p1/** 用户数据绝不拦截；跨域封面交给浏览器 HTTP 缓存
const CACHE = `shell-${version}`;

const toPrecache = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(toPrecache))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return; // 跨域封面交给浏览器
	if (url.pathname.startsWith('/api/p1')) return; // 用户数据绝不缓存

	// 页面导航：network-first，离线回退已缓存页面或首页
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((res) => {
					caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
					return res;
				})
				.catch(() => caches.match(request).then((hit) => hit || caches.match('/'))),
		);
		return;
	}

	const cacheFirst =
		url.pathname.startsWith('/_app/immutable/') ||
		files.includes(url.pathname) ||
		url.pathname === '/api/img/' ||
		toPrecache.includes(url.pathname);

	if (cacheFirst) {
		event.respondWith(
			caches.match(request).then(
				(hit) =>
					hit ||
					fetch(request).then((res) => {
						if (res.ok) {
							const copy = res.clone();
							caches.open(CACHE).then((cache) => cache.put(request, copy));
						}
						return res;
					}),
			),
		);
	}
});
