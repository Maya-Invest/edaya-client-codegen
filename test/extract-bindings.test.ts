import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { X_EDAYA_KIND } from '../src/contract/extensions'
import { extractClientBindingsFromOpenApi } from '../src/extract/bindings'
import { loadOpenApi } from '../src/openapi/load'

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

		const listOperation = openApi.paths?.['/core/entities/students/list']?.post
		expect(listOperation?.[X_EDAYA_KIND]).toBe('entity')
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
