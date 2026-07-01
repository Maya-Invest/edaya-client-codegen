export interface TransportRequestOptions {
	body?: unknown
}

export interface Transport {
	request: <T>(method: string, path: string, options?: TransportRequestOptions) => Promise<T>
}
