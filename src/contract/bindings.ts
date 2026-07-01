export interface ClientEntityBinding {
	publicName: string
	schemaName: string
	allowDirectSave: boolean
}

export interface ClientCommandBinding {
	publicName: string
	requestSchemaName: string
	responseSchemaName: string
}

export interface ClientQueryBinding {
	publicName: string
	requestSchemaName: string
	responseSchemaName: string
}

export interface ClientNamespaceRouteBinding {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	path: string
	pathParams?: string[]
	requestSchemaName?: string
	responseSchemaName?: string
	basePath?: 'core' | 'root'
	responseIsArray?: boolean
}

export type ClientNamespaceBindings = Record<string, ClientNamespaceRouteBinding>

export const CORE_BINDING_KEYS = ['entities', 'commands', 'queries'] as const

export type CoreBindingKey = typeof CORE_BINDING_KEYS[number]

export interface ClientBindingsDocument {
	entities: Record<string, ClientEntityBinding>
	commands: Record<string, ClientCommandBinding>
	queries: Record<string, ClientQueryBinding>
	[namespaceKey: string]:
		| Record<string, ClientEntityBinding>
		| Record<string, ClientCommandBinding>
		| Record<string, ClientQueryBinding>
		| Record<string, ClientNamespaceRouteBinding>
}

export function createEmptyClientBindingsDocument(): ClientBindingsDocument {
	return {
		entities: {},
		commands: {},
		queries: {},
	}
}

export function getNamespaceKeys(bindings: ClientBindingsDocument): string[] {
	return Object.keys(bindings)
		.filter(key => !CORE_BINDING_KEYS.includes(key as CoreBindingKey))
		.sort()
}

export function getNamespaceBindings(
	bindings: ClientBindingsDocument,
	namespace: string,
): ClientNamespaceBindings {
	const value = bindings[namespace]
	if (!value || typeof value !== 'object') {
		return {}
	}
	return value as ClientNamespaceBindings
}
