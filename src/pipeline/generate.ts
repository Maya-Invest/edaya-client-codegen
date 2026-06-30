import { writeClientBindingsTypeScript } from '../emit/bindings'
import { writeCreateClientTypeScript } from '../emit/client'
import { generateSchemaTypeScript } from '../emit/schema'
import { extractClientBindingsFromOpenApi } from '../extract/bindings'
import { loadOpenApi } from '../openapi/load'
import type { GenerateArtifactsOptions } from './types'

export async function generateClientArtifacts(
	options: GenerateArtifactsOptions,
): Promise<void> {
	const openApi = await loadOpenApi(options.input, { headers: options.headers })

	if (options.bindingsOut) {
		const bindings = extractClientBindingsFromOpenApi(openApi)
		writeClientBindingsTypeScript(bindings, options.bindingsOut, {
			banner: options.bindingsBanner,
		})
	}

	if (options.schemaOut) {
		await generateSchemaTypeScript(openApi, options.schemaOut)
	}

	if (options.clientOut) {
		const bindings = extractClientBindingsFromOpenApi(openApi)
		writeCreateClientTypeScript(bindings, options.clientOut, {
			banner: options.clientBanner,
		})
	}
}
