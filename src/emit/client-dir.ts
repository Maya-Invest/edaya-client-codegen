import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { ClientBindingsDocument } from '../contract/bindings'
import { DEFAULT_BINDINGS_BANNER, DEFAULT_CLIENT_BANNER } from './banners'
import { writeClientBindingsTypeScript } from './bindings'
import { writeCreateClientTypeScript } from './client'
import { generateSchemaTypeScript } from './schema'

const packageRoot = resolve(import.meta.dirname, '../..')
const runtimeTemplatesDir = join(packageRoot, 'templates/runtime')

export const RUNTIME_TEMPLATE_FILES = [
	'entity-resource.ts',
	'entity-envelope.ts',
	'transport.ts',
	'paths.ts',
	'errors.ts',
	'index.ts',
] as const

export interface ClientDirectoryOptions {
	schemaOut?: string
	runtimeVersion?: string
	bindingsBanner?: string
	clientBanner?: string
}

function runtimeBanner(runtimeVersion?: string): string {
	if (!runtimeVersion) {
		return '// @edaya/client-codegen runtime\n'
	}
	return `// @edaya/client-codegen runtime v${runtimeVersion}\n`
}

export function copyRuntimeTemplates(
	clientDir: string,
	runtimeVersion?: string,
): void {
	const runtimeDir = join(clientDir, 'runtime')
	mkdirSync(runtimeDir, { recursive: true })
	const banner = runtimeBanner(runtimeVersion)

	for (const fileName of RUNTIME_TEMPLATE_FILES) {
		const source = readFileSync(join(runtimeTemplatesDir, fileName), 'utf8')
		writeFileSync(join(runtimeDir, fileName), `${banner}${source}`)
	}
}

export function formatClientIndexTypeScript(): string {
	return `export { createSchoolClient, type SchoolClient } from './generated/create-client'
export { clientBindings, type ClientBindings } from './generated/client-bindings'
export { ApiError } from './runtime/errors'
export { unwrapEntity, unwrapEntityList } from './runtime/entity-envelope'
export {
	type BaseEntityResource,
	type DirectSaveEntityResource,
	type EntityQuery,
	EntityResource,
} from './runtime/entity-resource'
export { resolveClientRoutePath, schoolApiPath, SCHOOL_API_BASE_PATH } from './runtime/paths'
export { type Transport, type TransportRequestOptions } from './runtime/transport'
`
}

export function formatCreateClientTestTypeScript(): string {
	return `import type { Transport, TransportRequestOptions } from '../runtime/transport'
import { describe, expect, test } from 'bun:test'
import { createSchoolClient } from './create-client'

interface RequestRecord {
	method: string
	path: string
	options?: TransportRequestOptions
}

function createRecordingTransport(responses: unknown[]): {
	requests: RequestRecord[]
	transport: Transport
} {
	const requests: RequestRecord[] = []
	return {
		requests,
		transport: {
			async request<T>(method: string, path: string, options?: TransportRequestOptions): Promise<T> {
				requests.push({ method, path, options })
				return responses.shift() as T
			},
		},
	}
}

describe('createSchoolClient', () => {
	test('records entity list requests against generated bindings', async () => {
		const firstEntityKey = Object.keys(createSchoolClient<Record<string, unknown>>({
			async request<T>(): Promise<T> {
				return [] as T
			},
		}).entities)[0]
		if (!firstEntityKey) {
			return
		}

		const { requests, transport } = createRecordingTransport([[]])
		const client = createSchoolClient<Record<string, unknown>>(transport)
		await client.entities[firstEntityKey as keyof typeof client.entities].list({})

		expect(requests[0]?.method).toBe('POST')
		expect(requests[0]?.path).toMatch(/^\\/core\\/entities\\//)
	})
})
`
}

export function getClientDirectoryArtifacts(
	clientDir: string,
	options: { includeSchema?: boolean } = {},
): string[] {
	const artifacts = [
		'index.ts',
		'generated/client-bindings.ts',
		'generated/create-client.ts',
		'generated/create-client.test.ts',
		...RUNTIME_TEMPLATE_FILES.map(fileName => `runtime/${fileName}`),
	]

	if (options.includeSchema) {
		artifacts.push('schema.d.ts')
	}

	return artifacts.map(relativePath => join(clientDir, relativePath))
}

export async function generateClientDirectory(
	openApi: Parameters<typeof generateSchemaTypeScript>[0],
	bindings: ClientBindingsDocument,
	clientDir: string,
	options: ClientDirectoryOptions = {},
): Promise<void> {
	const generatedDir = join(clientDir, 'generated')
	mkdirSync(generatedDir, { recursive: true })

	copyRuntimeTemplates(clientDir, options.runtimeVersion)

	writeClientBindingsTypeScript(bindings, join(generatedDir, 'client-bindings.ts'), {
		banner: options.bindingsBanner ?? DEFAULT_BINDINGS_BANNER,
	})

	writeCreateClientTypeScript(bindings, join(generatedDir, 'create-client.ts'), {
		banner: options.clientBanner ?? DEFAULT_CLIENT_BANNER,
	})

	writeFileSync(
		join(generatedDir, 'create-client.test.ts'),
		formatCreateClientTestTypeScript(),
	)

	writeFileSync(join(clientDir, 'index.ts'), formatClientIndexTypeScript())

	const schemaOut = options.schemaOut ?? join(clientDir, 'schema.d.ts')
	await generateSchemaTypeScript(openApi, schemaOut)
}

export function copyRuntimeTemplatesTo(
	sourceClientDir: string,
	targetClientDir: string,
): void {
	for (const fileName of RUNTIME_TEMPLATE_FILES) {
		const source = join(sourceClientDir, 'runtime', fileName)
		const target = join(targetClientDir, 'runtime', fileName)
		mkdirSync(dirname(target), { recursive: true })
		copyFileSync(source, target)
	}
}

export function listRuntimeTemplateFiles(): string[] {
	return readdirSync(runtimeTemplatesDir).filter(fileName => fileName.endsWith('.ts')).sort()
}
