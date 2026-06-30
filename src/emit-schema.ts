import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import openapiTS, { astToString, type OpenAPI3 } from 'openapi-typescript'
import { loadOpenApi } from './load-openapi.ts'
import type { OpenApiDocument } from './types.ts'

export async function generateSchemaTypeScript(
	input: string | OpenApiDocument,
	outputPath: string,
): Promise<void> {
	const openApi = typeof input === 'string'
		? await loadOpenApi(input)
		: input

	const ast = await openapiTS(openApi as unknown as OpenAPI3)
	mkdirSync(dirname(outputPath), { recursive: true })
	writeFileSync(outputPath, astToString(ast))
}
