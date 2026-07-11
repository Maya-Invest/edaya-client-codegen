import type { Transport, TransportRequestOptions } from '../runtime/transport'
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
		expect(requests[0]?.path).toMatch(/^\/core\/entities\//)
	})
})
