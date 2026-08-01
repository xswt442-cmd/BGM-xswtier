const STORAGE_KEY = 'bgmtier-token';

function loadToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(STORAGE_KEY);
}

let token = $state<string | null>(loadToken());

export const apiToken = {
	get token() {
		return token;
	},
	get hasToken() {
		return token !== null && token.length > 0;
	},
	setToken(t: string | null) {
		token = t;
		if (t) localStorage.setItem(STORAGE_KEY, t);
		else localStorage.removeItem(STORAGE_KEY);
	},
	clear() {
		this.setToken(null);
	}
};
