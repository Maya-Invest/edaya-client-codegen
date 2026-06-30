import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { findDriftedArtifacts } from './drift.ts'
import { writeClientBindingsTypeScript } from './emit-bindings.ts'
import { writeCreateClientTypeScript } from './emit-client.ts'
import { generateSchemaTypeScript } from './emit-schema.ts'
import { extractClientBindingsFromOpenApi } from './extract-bindings.ts'
import { loadOpenApi } from './load-openapi.ts'
import type { CheckArtifactsOptions, GenerateArtifactsOptions } from './types.ts'

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

export async function checkClientArtifacts(
	options: CheckArtifactsOptions,
): Promise<string[]> {
	if (!options.bindingsOut && !options.schemaOut && !options.openApiOut && !options.clientOut) {
		throw new Error('checkClientArtifacts requires at least one tracked output path')
	}

	const temporaryDirectory = mkdtempSync(join(tmpdir(), 'edaya-client-codegen-check-'))
	const repoRoot = options.repoRoot ?? process.cwd()

	try {
		const openApi = await loadOpenApi(options.input, { headers: options.headers })
		const artifacts = []

		if (options.openApiOut) {
			const generatedOpenApi = join(temporaryDirectory, 'openapi.json')
			writeFileSync(generatedOpenApi, JSON.stringify(openApi, null, 2))
			artifacts.push({ generated: generatedOpenApi, tracked: options.openApiOut })
		}

		if (options.bindingsOut) {
			const generatedBindings = join(temporaryDirectory, 'client-bindings.ts')
			const bindings = extractClientBindingsFromOpenApi(openApi)
			writeClientBindingsTypeScript(bindings, generatedBindings, {
				banner: options.bindingsBanner,
			})
			artifacts.push({ generated: generatedBindings, tracked: options.bindingsOut })
		}

		if (options.schemaOut) {
			const generatedSchema = join(temporaryDirectory, 'schema.d.ts')
			await generateSchemaTypeScript(openApi, generatedSchema)
			artifacts.push({ generated: generatedSchema, tracked: options.schemaOut })
		}

		if (options.clientOut) {
			const generatedClient = join(temporaryDirectory, 'create-client.ts')
			const bindings = extractClientBindingsFromOpenApi(openApi)
			writeCreateClientTypeScript(bindings, generatedClient, {
				banner: options.clientBanner,
			})
			artifacts.push({ generated: generatedClient, tracked: options.clientOut })
		}

		return findDriftedArtifacts(artifacts, repoRoot)
	}
	finally {
		rmSync(temporaryDirectory, { recursive: true, force: true })
	}
}

export async function writeOpenApiSnapshot(
	input: string,
	outputPath: string,
	headers?: Record<string, string>,
): Promise<void> {
	const openApi = await loadOpenApi(input, { headers })
	mkdirSync(dirname(outputPath), { recursive: true })
	writeFileSync(outputPath, JSON.stringify(openApi, null, 2))
}
