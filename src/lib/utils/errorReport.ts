// 生产环境轻量错误上报：全局 error / unhandledrejection 钩子，
// 同一错误（消息+首行堆栈）去重、单会话限量，发往同源 /api/log（服务端落 Vercel 日志）。
// 刻意最小化：不收集任何 localStorage 内容，消息截断 500 字符。

const MAX_REPORTS = 10;
const MAX_MESSAGE = 500;

export type ErrorReportPayload = {
	level: 'error';
	message: string;
	stack: string;
	source: string;
	url: string;
};

export type ErrorSender = (payload: ErrorReportPayload) => void;

function dedupeKey(err: unknown): string {
	const message = err instanceof Error ? err.message : String(err);
	const stackHead = err instanceof Error && err.stack ? (err.stack.split('\n')[1] ?? '').trim().slice(0, 120) : '';
	return `${message}::${stackHead}`;
}

export function createErrorReporter(send: ErrorSender) {
	const seen = new Set<string>();
	let sent = 0;
	return function report(err: unknown, source = ''): void {
		if (sent >= MAX_REPORTS) return;
		const k = dedupeKey(err);
		if (seen.has(k)) return;
		seen.add(k);
		sent += 1;
		const message = err instanceof Error ? err.message : String(err);
		send({
			level: 'error',
			message: message.slice(0, MAX_MESSAGE),
			stack: err instanceof Error && err.stack ? (err.stack.split('\n')[1] ?? '').trim().slice(0, 120) : '',
			source,
			url: typeof location !== 'undefined' ? `${location.pathname}${location.hash.slice(0, 40)}` : '',
		});
	};
}

/** 挂 window 全局钩子；返回卸载函数（应用生命周期内基本用不到） */
export function installGlobalErrorReporting(report: (err: unknown, source?: string) => void): () => void {
	if (typeof window === 'undefined') return () => {};
	const onError = (ev: ErrorEvent) => report(ev.error ?? ev.message, 'window.onerror');
	const onRejection = (ev: PromiseRejectionEvent) => report(ev.reason, 'unhandledrejection');
	window.addEventListener('error', onError);
	window.addEventListener('unhandledrejection', onRejection);
	return () => {
		window.removeEventListener('error', onError);
		window.removeEventListener('unhandledrejection', onRejection);
	};
}
