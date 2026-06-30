/** @deprecated Legacy spec extension. Prefer operation-level `x-edaya-*` metadata. */
export const CLIENT_BINDINGS_OPENAPI_EXTENSION = 'x-edaya-client-bindings'

export const X_EDAYA_KIND = 'x-edaya-kind'
export const X_EDAYA_ENTITY_KEY = 'x-edaya-entity-key'
export const X_EDAYA_ENTITY_PUBLIC_NAME = 'x-edaya-entity-public-name'
export const X_EDAYA_RESPONSE_SCHEMA = 'x-edaya-response-schema'
export const X_EDAYA_ALLOW_DIRECT_SAVE = 'x-edaya-allow-direct-save'
export const X_EDAYA_COMMAND_KEY = 'x-edaya-command-key'
export const X_EDAYA_COMMAND_PUBLIC_NAME = 'x-edaya-command-public-name'
export const X_EDAYA_REQUEST_SCHEMA = 'x-edaya-request-schema'
export const X_EDAYA_QUERY_KEY = 'x-edaya-query-key'
export const X_EDAYA_QUERY_PUBLIC_NAME = 'x-edaya-query-public-name'
export const X_EDAYA_CLIENT_KEY = 'x-edaya-client-key'
export const X_EDAYA_CLIENT_PATH = 'x-edaya-client-path'
export const X_EDAYA_PATH_PARAMS = 'x-edaya-path-params'
export const X_EDAYA_BASE_PATH = 'x-edaya-base-path'
export const X_EDAYA_RESPONSE_IS_ARRAY = 'x-edaya-response-is-array'

export const CLIENT_ROUTE_NAMESPACES = [
	'authorization',
	'onboarding',
	'files',
	'serviceAccounts',
	'public',
	'webhooks',
] as const

export type ClientRouteNamespace = typeof CLIENT_ROUTE_NAMESPACES[number]

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

export type OpenApiOperation = Record<string, unknown>
export type OpenApiPathItem = Partial<
	Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>
>

export interface OpenApiDocument {
	openapi?: string
	info?: Record<string, unknown>
	paths?: Record<string, OpenApiPathItem>
}

export interface GeneratedArtifact {
	generated: string
	tracked: string
}

export interface LoadOpenApiOptions {
	headers?: Record<string, string>
}

export interface GenerateArtifactsOptions {
	input: string
	bindingsOut?: string
	schemaOut?: string
	clientOut?: string
	headers?: Record<string, string>
	bindingsBanner?: string
	clientBanner?: string
}

export interface CheckArtifactsOptions extends GenerateArtifactsOptions {
	repoRoot?: string
	openApiOut?: string
}

export function createEmptyClientBindingsDocument(): ClientBindingsDocument {
	return {
		entities: {},
		commands: {},
		queries: {},
		authorization: {},
		onboarding: {},
		files: {},
		serviceAccounts: {},
		public: {},
		webhooks: {},
	}
}
