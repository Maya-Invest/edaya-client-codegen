import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { X_EDAYA_KIND } from '../src/contract/extensions'
import { getNamespaceKeys } from '../src/contract/bindings'
import { generateClientDirectory, getClientDirectoryArtifacts, RUNTIME_TEMPLATE_FILES } from '../src/emit/client-dir'
import { extractClientBindingsFromOpenApi } from '../src/extract/bindings'
import { loadOpenApi } from '../src/openapi/load'
import { checkClientArtifacts } from '../src/pipeline/check'
import { generateClientArtifacts } from '../src/pipeline/generate'

const fixturePath = resolve(
	import.meta.dirname,
	'./fixtures/minimal-openapi.json',
)

describe('extractClientBindingsFromOpenApi', () => {
	it('reads client bindings from annotated core operations in a fixture file', async () => {
		const openApi = await loadOpenApi(fixturePath)
		const bindings = extractClientBindingsFromOpenApi(openApi)

		expect(bindings.entities.schools).toEqual({
			publicName: 'schools',
			schemaName: 'School',
			allowDirectSave: true,
		})
		expect(bindings.commands.registerSchool.publicName).toBe('register-school')
		expect(bindings.authorization.effectiveGrants).toEqual({
			method: 'GET',
			path: 'authorization/effective-grants',
			responseSchemaName: 'EffectiveGrantsResponse',
		})
		expect(getNamespaceKeys(bindings)).toContain('authorization')

		const listOperation = openApi.paths?.['/core/entities/students/list']?.post
		expect(listOperation?.[X_EDAYA_KIND]).toBe('entity')
	})

	it('discovers namespace routes without a hardcoded namespace list', async () => {
		const openApi = await loadOpenApi(fixturePath)
		openApi.paths = {
			...openApi.paths,
			'/core/reports/summary': {
				get: {
					operationId: 'reports.summary',
					'x-edaya-kind': 'reports',
					'x-edaya-client-key': 'summary',
					'x-edaya-client-path': 'reports/summary',
					'x-edaya-response-schema': 'ReportSummary',
				},
			},
		}

		const bindings = extractClientBindingsFromOpenApi(openApi)
		expect(getNamespaceKeys(bindings)).toContain('reports')
		expect(bindings.reports.summary.method).toBe('GET')
	})
})

describe('generateClientDirectory', () => {
	it('emits a self-contained client directory with runtime templates', async () => {
		const openApi = await loadOpenApi(fixturePath)
		const bindings = extractClientBindingsFromOpenApi(openApi)
		const clientDir = mkdtempSync(join(tmpdir(), 'edaya-client-codegen-generate-'))

		try {
			await generateClientDirectory(openApi, bindings, clientDir, {
				runtimeVersion: '0.1.0-test',
			})

			const artifacts = getClientDirectoryArtifacts(clientDir, { includeSchema: true })
			expect(artifacts.length).toBeGreaterThan(0)

			for (const artifact of artifacts) {
				expect(Bun.file(artifact).size).toBeGreaterThan(0)
			}

			expect(RUNTIME_TEMPLATE_FILES.length).toBe(6)
			const createClient = await Bun.file(join(clientDir, 'generated/create-client.ts')).text()
			expect(createClient).toContain('../runtime/entity-resource')
		}
		finally {
			rmSync(clientDir, { recursive: true, force: true })
		}
	})
})

describe('checkClientArtifacts with client-dir', () => {
	it('reports no drift for a freshly generated client directory', async () => {
		const clientDir = mkdtempSync(join(tmpdir(), 'edaya-client-codegen-check-'))

		try {
			await generateClientArtifacts({
				input: fixturePath,
				clientDir,
			})

			const changed = await checkClientArtifacts({
				input: fixturePath,
				clientDir,
				repoRoot: resolve(clientDir, '..'),
			})
			expect(changed).toEqual([])
		}
		finally {
			rmSync(clientDir, { recursive: true, force: true })
		}
	})
})

describe('loadOpenApi', () => {
	it('loads OpenAPI documents from http URLs', async () => {
		const fixture = await loadOpenApi(fixturePath)
		const originalFetch = globalThis.fetch

		globalThis.fetch = (async () => new Response(JSON.stringify(fixture), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		})) as unknown as typeof fetch

		try {
			const loaded = await loadOpenApi('https://example.com/openapi.json')
			expect(loaded.info?.title).toBe(fixture.info?.title)
		}
		finally {
			globalThis.fetch = originalFetch
		}
	})

	it('passes custom headers when fetching a URL', async () => {
		const fixture = await loadOpenApi(fixturePath)
		let receivedHeader = ''
		const originalFetch = globalThis.fetch

		globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
			receivedHeader = new Headers(init?.headers).get('x-test-header') ?? ''
			return new Response(JSON.stringify(fixture), { status: 200 })
		}) as unknown as typeof fetch

		try {
			await loadOpenApi('https://example.com/openapi.json', {
				headers: { 'X-Test-Header': 'example-value' },
			})
			expect(receivedHeader).toBe('example-value')
		}
		finally {
			globalThis.fetch = originalFetch
		}
	})
})
