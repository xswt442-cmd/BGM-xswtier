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
}
