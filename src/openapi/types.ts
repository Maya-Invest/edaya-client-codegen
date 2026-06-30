export type OpenApiOperation = Record<string, unknown>
export type OpenApiPathItem = Partial<
	Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>
>

export interface OpenApiDocument {
	openapi?: string
	info?: Record<string, unknown>
	paths?: Record<string, OpenApiPathItem>
}

export interface LoadOpenApiOptions {
	headers?: Record<string, string>
}
