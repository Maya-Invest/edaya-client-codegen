import { join } from 'node:path'
import { generateClientDirectory } from '../emit/client-dir'
import { writeClientBindingsTypeScript } from '../emit/bindings'
import { writeCreateClientTypeScript } from '../emit/client'
import { generateSchemaTypeScript } from '../emit/schema'
import { extractClientBindingsFromOpenApi } from '../extract/bindings'
import { loadOpenApi } from '../openapi/load'
import type { GenerateArtifactsOptions } from './types'

const LEGACY_RUNTIME_IMPORTS = {
	entityResource: '../entity-resource',
	transport: '../transport',
	paths: '../paths',
}

export async function generateClientArtifacts(
	options: GenerateArtifactsOptions,
): Promise<void> {
	const openApi = await loadOpenApi(options.input, { headers: options.headers })
	const bindings = extractClientBindingsFromOpenApi(openApi)

	if (options.clientDir) {
		await generateClientDirectory(openApi, bindings, options.clientDir, {
			schemaOut: options.schemaOut,
			runtimeVersion: options.runtimeVersion,
			bindingsBanner: options.bindingsBanner,
			clientBanner: options.clientBanner,
		})
	}

	if (options.bindingsOut) {
		writeClientBindingsTypeScript(bindings, options.bindingsOut, {
			banner: options.bindingsBanner,
		})
	}

	if (options.schemaOut && !options.clientDir) {
		await generateSchemaTypeScript(openApi, options.schemaOut)
	}

	if (options.clientOut) {
		writeCreateClientTypeScript(bindings, options.clientOut, {
			banner: options.clientBanner,
			runtimeImports: LEGACY_RUNTIME_IMPORTS,
		})
	}
}

export function resolveClientDirSchemaOut(clientDir: string, schemaOut?: string): string {
	return schemaOut ?? join(clientDir, 'schema.d.ts')
}
