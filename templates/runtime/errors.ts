export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly body: unknown,
	) {
		super(`API request failed (${status})`)
		this.name = 'ApiError'
	}
}
