// 手写最小 BGM v0 公开 API 类型（只覆盖本工具用到的 3 个端点 + schema）
// 字段照官方 OpenAPI（legacy 生成文件 1726/2022/2361/2448/2569 行）核对
export type SubjectType = 1 | 2 | 3 | 4 | 6;

export interface Images {
	large: string;
	common: string;
	medium: string;
	small: string;
	grid: string;
}

export interface SubjectRating {
	rank: number;
	total: number;
	count: { 1?: number; 2?: number; 3?: number; 4?: number; 5?: number; 6?: number; 7?: number; 8?: number; 9?: number; 10?: number };
	score: number;
}

export interface Subject {
	id: number;
	type: number & SubjectType;
	name: string;
	name_cn: string;
	summary: string;
	date?: string; // YYYY-MM-DD
	images: Images;
	eps: number;
	total_episodes: number;
	rating: SubjectRating;
}

export interface SlimSubject {
	id: number;
	type: number & SubjectType;
	name: string;
	name_cn: string;
	date?: string;
	images: Images;
	eps: number;
	collection_total: number;
	score: number;
	rank: number;
}

export interface IndexSubject {
	id: number;
	type: number;
	name: string;
	images?: Images;
	date?: string;
	comment: string;
}

export interface UserSubjectCollection {
	subject_id: number;
	subject_type: SubjectType;
	rate: number;
	type: number; // CollectionType 1-5
	comment?: string;
	tags: string[];
	ep_status: number;
	vol_status: number;
	updated_at: string;
	private: boolean;
	subject?: SlimSubject;
}

export interface Paged_IndexSubject {
	total: number;
	limit: number;
	offset: number;
	data: IndexSubject[];
}

export interface Paged_UserCollection {
	total: number;
	limit: number;
	offset: number;
	data: UserSubjectCollection[];
}

// ===== 搜索 / 日历 / 热门（搜索筛选功能新增）=====

export interface SearchSubjectFilter {
	type?: SubjectType[]; // 2=动画，或关系
	tag?: string[]; // 且关系
	meta_tags?: string[];
	air_date?: string[]; // 如 [">=2024-07-01", "<2024-10-01"]，且关系
	rating?: string[];
	rating_count?: string[];
	rank?: string[];
	nsfw?: boolean;
}

export interface SearchSubjectRequest {
	keyword: string;
	sort?: 'match' | 'heat' | 'rank' | 'score';
	filter?: SearchSubjectFilter;
}

export interface Paged_Subject {
	total: number;
	limit: number;
	offset: number;
	data: Subject[]; // 完整 Subject（含 date）
}

/** /calendar 每日放送（legacy 根路径，字段全部可选） */
export interface LegacySubjectSmall {
	id?: number;
	url?: string;
	type?: SubjectType;
	name?: string;
	name_cn?: string;
	summary?: string;
	air_date?: string;
	air_weekday?: number;
	images?: Images;
	eps?: number;
	eps_count?: number;
	rating?: { total?: number; count?: Record<number, number>; score?: number };
}

export interface CalendarWeekday {
	en?: string;
	cn?: string;
	ja?: string;
	id?: number;
}
export type CalendarDay = { weekday?: CalendarWeekday; items?: LegacySubjectSmall[] };

/** /p1/trending/subjects */
export interface TrendingSubject {
	subject: SlimSubject;
	count: number;
}
export interface TrendingSubjectResponse {
	data: TrendingSubject[];
	total: number;
}

export interface paths {
	'/v0/subjects/{subject_id}': {
		get: {
			parameters: { path: { subject_id: number } };
			responses: {
				200: { content: { 'application/json': Subject } };
			};
		};
	};
	'/v0/users/{username}/collections': {
		get: {
			parameters: {
				path: { username: string };
				query?: { subject_type?: SubjectType; type?: number; limit?: number; offset?: number };
			};
			responses: {
				200: { content: { 'application/json': Paged_UserCollection } };
			};
		};
	};
	'/v0/indices/{index_id}/subjects': {
		get: {
			parameters: {
				path: { index_id: number };
				query?: { limit?: number; offset?: number };
			};
			// 官方 spec 该端点 200 无 content schema，用本地类型兜底
			responses: {
				200: { content: { 'application/json': Paged_IndexSubject } };
			};
		};
	};
	'/v0/search/subjects': {
		post: {
			parameters: { query?: { limit?: number; offset?: number } };
			requestBody: { content: { 'application/json': SearchSubjectRequest } };
			responses: {
				200: { content: { 'application/json': Paged_Subject } };
			};
		};
	};
	'/calendar': {
		get: {
			responses: {
				200: { content: { 'application/json': CalendarDay[] } };
			};
		};
	};
	'/p1/trending/subjects': {
		get: {
			parameters: { query: { type: SubjectType; limit?: number; offset?: number } };
			responses: {
				200: { content: { 'application/json': TrendingSubjectResponse } };
			};
		};
	};
}
