import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { LoadOpenApiOptions, OpenApiDocument } from './types.ts'

export function isOpenApiUrl(input: string): boolean {
	try {
		const url = new URL(input)
		return url.protocol === 'http:' || url.protocol === 'https:'
	}
	catch {
		return false
	}
}

export async function loadOpenApi(
	input: string,
	options: LoadOpenApiOptions = {},
): Promise<OpenApiDocument> {
	if (isOpenApiUrl(input)) {
		const response = await fetch(input, {
			headers: options.headers,
		})
		if (!response.ok) {
			const body = await response.text()
			throw new Error(
				`Failed to fetch OpenAPI document from ${input}: ${response.status}\n${body}`,
			)
		}
		return await response.json() as OpenApiDocument
	}

	const filePath = resolve(input)
	const contents = readFileSync(filePath, 'utf8')
	return JSON.parse(contents) as OpenApiDocument
}

export function resolveOpenApiSource(input: string): string {
	return isOpenApiUrl(input) ? input : resolve(input)
}
