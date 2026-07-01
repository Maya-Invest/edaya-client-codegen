import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { getClientDirectoryArtifacts, generateClientDirectory } from '../emit/client-dir'
import { writeClientBindingsTypeScript } from '../emit/bindings'
import { writeCreateClientTypeScript } from '../emit/client'
import { generateSchemaTypeScript } from '../emit/schema'
import { extractClientBindingsFromOpenApi } from '../extract/bindings'
import { loadOpenApi } from '../openapi/load'
import { findDriftedArtifacts } from './drift'
import type { CheckArtifactsOptions } from './types'

const LEGACY_RUNTIME_IMPORTS = {
	entityResource: '../entity-resource',
	transport: '../transport',
	paths: '../paths',
}

export async function checkClientArtifacts(
	options: CheckArtifactsOptions,
): Promise<string[]> {
	if (
		!options.bindingsOut
		&& !options.schemaOut
		&& !options.openApiOut
		&& !options.clientOut
		&& !options.clientDir
	) {
		throw new Error('checkClientArtifacts requires at least one tracked output path')
	}

	const temporaryDirectory = mkdtempSync(join(tmpdir(), 'edaya-client-codegen-check-'))
	const repoRoot = options.repoRoot ?? process.cwd()

	try {
		const openApi = await loadOpenApi(options.input, { headers: options.headers })
		const bindings = extractClientBindingsFromOpenApi(openApi)
		const artifacts = []

		if (options.openApiOut) {
			const generatedOpenApi = join(temporaryDirectory, 'openapi.json')
			writeFileSync(generatedOpenApi, JSON.stringify(openApi, null, 2))
			artifacts.push({ generated: generatedOpenApi, tracked: options.openApiOut })
		}

		if (options.clientDir) {
			const generatedClientDir = join(temporaryDirectory, 'api-client')
			const trackedSchemaOut = options.schemaOut ?? join(options.clientDir, 'schema.d.ts')
			const includeSchemaInClientDir = trackedSchemaOut.startsWith(`${options.clientDir}/`)
			const generatedSchemaPath = includeSchemaInClientDir
				? join(generatedClientDir, 'schema.d.ts')
				: join(temporaryDirectory, 'schema.d.ts')

			await generateClientDirectory(openApi, bindings, generatedClientDir, {
				schemaOut: generatedSchemaPath,
				runtimeVersion: options.runtimeVersion,
				bindingsBanner: options.bindingsBanner,
				clientBanner: options.clientBanner,
			})

			for (const trackedPath of getClientDirectoryArtifacts(options.clientDir, {
				includeSchema: includeSchemaInClientDir,
			})) {
				const relativePath = trackedPath.slice(options.clientDir.length + 1)
				artifacts.push({
					generated: join(generatedClientDir, relativePath),
					tracked: trackedPath,
				})
			}

			if (!includeSchemaInClientDir) {
				artifacts.push({
					generated: generatedSchemaPath,
					tracked: trackedSchemaOut,
				})
			}
		}

		if (options.bindingsOut) {
			const generatedBindings = join(temporaryDirectory, 'client-bindings')
			writeClientBindingsTypeScript(bindings, generatedBindings, {
				banner: options.bindingsBanner,
			})
			artifacts.push({ generated: generatedBindings, tracked: options.bindingsOut })
		}

		if (options.schemaOut && !options.clientDir) {
			const generatedSchema = join(temporaryDirectory, 'schema.d')
			await generateSchemaTypeScript(openApi, generatedSchema)
			artifacts.push({ generated: generatedSchema, tracked: options.schemaOut })
		}

		if (options.clientOut) {
			const generatedClient = join(temporaryDirectory, 'create-client')
			writeCreateClientTypeScript(bindings, generatedClient, {
				banner: options.clientBanner,
				runtimeImports: LEGACY_RUNTIME_IMPORTS,
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
