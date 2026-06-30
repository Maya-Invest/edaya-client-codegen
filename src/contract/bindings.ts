import { CLIENT_ROUTE_NAMESPACES } from './extensions'

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

/** @deprecated Use ClientNamespaceRouteBinding */
export type ClientAuthorizationBinding = ClientNamespaceRouteBinding

export type ClientNamespaceBindings = Record<string, ClientNamespaceRouteBinding>

export interface ClientBindingsDocument {
	entities: Record<string, ClientEntityBinding>
	commands: Record<string, ClientCommandBinding>
	queries: Record<string, ClientQueryBinding>
	authorization: ClientNamespaceBindings
	onboarding: ClientNamespaceBindings
	files: ClientNamespaceBindings
	serviceAccounts: ClientNamespaceBindings
	public: ClientNamespaceBindings
	webhooks: ClientNamespaceBindings
}

export function createEmptyClientBindingsDocument(): ClientBindingsDocument {
	const namespaces = Object.fromEntries(
		CLIENT_ROUTE_NAMESPACES.map(namespace => [namespace, {}]),
	) as Pick<
		ClientBindingsDocument,
		(typeof CLIENT_ROUTE_NAMESPACES)[number]
	>

	return {
		entities: {},
		commands: {},
		queries: {},
		...namespaces,
	}
}
