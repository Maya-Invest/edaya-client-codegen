// @edaya/client-codegen runtime
function isEntityEnvelope(value: unknown): value is { data: Record<string, unknown> } & Record<string, unknown> {
	if (typeof value !== 'object' || value === null || !('data' in value)) {
		return false
	}

	const { data } = value as { data: unknown }
	return typeof data === 'object' && data !== null
}

export function unwrapEntity<T>(value: unknown): T {
	if (Array.isArray(value)) {
		return value.map(entry => unwrapEntity(entry)) as T
	}

	if (!isEntityEnvelope(value)) {
		return value as T
	}

	const { data, ...rest } = value
	const merged: Record<string, unknown> = {}

	for (const [key, entry] of Object.entries(data)) {
		merged[key] = unwrapEntity(entry)
	}

	for (const [key, entry] of Object.entries(rest)) {
		merged[key] = unwrapEntity(entry)
	}

	return merged as T
}

export function unwrapEntityList<T>(values: unknown): T[] {
	if (!Array.isArray(values)) {
		return []
	}

	return values.map(entry => unwrapEntity<T>(entry))
}
