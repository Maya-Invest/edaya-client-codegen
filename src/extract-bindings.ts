import {
	CLIENT_BINDINGS_OPENAPI_EXTENSION,
	CLIENT_ROUTE_NAMESPACES,
	X_EDAYA_ALLOW_DIRECT_SAVE,
	X_EDAYA_BASE_PATH,
	X_EDAYA_CLIENT_KEY,
	X_EDAYA_CLIENT_PATH,
	X_EDAYA_COMMAND_KEY,
	X_EDAYA_COMMAND_PUBLIC_NAME,
	X_EDAYA_ENTITY_KEY,
	X_EDAYA_ENTITY_PUBLIC_NAME,
	X_EDAYA_KIND,
	X_EDAYA_PATH_PARAMS,
	X_EDAYA_QUERY_KEY,
	X_EDAYA_QUERY_PUBLIC_NAME,
	X_EDAYA_REQUEST_SCHEMA,
	X_EDAYA_RESPONSE_IS_ARRAY,
	X_EDAYA_RESPONSE_SCHEMA,
	createEmptyClientBindingsDocument,
} from './types.ts'
import type {
	ClientBindingsDocument,
	ClientCommandBinding,
	ClientEntityBinding,
	ClientNamespaceRouteBinding,
	ClientQueryBinding,
	ClientRouteNamespace,
	OpenApiDocument,
	OpenApiOperation,
} from './types.ts'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

function readString(operation: OpenApiOperation, key: string): string {
	const value = operation[key]
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`OpenAPI operation is missing string field ${key}`)
	}
	return value
}

function readOptionalString(operation: OpenApiOperation, key: string): string | undefined {
	const value = operation[key]
	if (value === undefined) {
		return undefined
	}
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`OpenAPI operation field ${key} must be a non-empty string`)
	}
	return value
}

function readBoolean(operation: OpenApiOperation, key: string, fallback: boolean): boolean {
	const value = operation[key]
	if (value === undefined) {
		return fallback
	}
	if (typeof value !== 'boolean') {
		throw new Error(`OpenAPI operation field ${key} must be a boolean`)
	}
	return value
}

function readStringArray(operation: OpenApiOperation, key: string): string[] | undefined {
	const value = operation[key]
	if (value === undefined) {
		return undefined
	}
	if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string' || entry.length === 0)) {
		throw new Error(`OpenAPI operation field ${key} must be a string array`)
	}
	return value
}

function readBasePath(operation: OpenApiOperation): 'core' | 'root' | undefined {
	const value = readOptionalString(operation, X_EDAYA_BASE_PATH)
	if (value === undefined) {
		return undefined
	}
	if (value !== 'core' && value !== 'root') {
		throw new Error(`OpenAPI operation field ${X_EDAYA_BASE_PATH} must be "core" or "root"`)
	}
	return value
}

function extractEntityBinding(operation: OpenApiOperation): [string, ClientEntityBinding] {
	const key = readString(operation, X_EDAYA_ENTITY_KEY)
	return [key, {
		publicName: readString(operation, X_EDAYA_ENTITY_PUBLIC_NAME),
		schemaName: readString(operation, X_EDAYA_RESPONSE_SCHEMA),
		allowDirectSave: readBoolean(operation, X_EDAYA_ALLOW_DIRECT_SAVE, true),
	}]
}

function extractCommandBinding(operation: OpenApiOperation): [string, ClientCommandBinding] {
	const key = readString(operation, X_EDAYA_COMMAND_KEY)
	return [key, {
		publicName: readString(operation, X_EDAYA_COMMAND_PUBLIC_NAME),
		requestSchemaName: readString(operation, X_EDAYA_REQUEST_SCHEMA),
		responseSchemaName: readString(operation, X_EDAYA_RESPONSE_SCHEMA),
	}]
}

function extractQueryBinding(operation: OpenApiOperation): [string, ClientQueryBinding] {
	const key = readString(operation, X_EDAYA_QUERY_KEY)
	return [key, {
		publicName: readString(operation, X_EDAYA_QUERY_PUBLIC_NAME),
		requestSchemaName: readString(operation, X_EDAYA_REQUEST_SCHEMA),
		responseSchemaName: readString(operation, X_EDAYA_RESPONSE_SCHEMA),
	}]
}

function extractNamespaceRouteBinding(
	method: ClientNamespaceRouteBinding['method'],
	operation: OpenApiOperation,
): [string, ClientNamespaceRouteBinding] {
	const key = readString(operation, X_EDAYA_CLIENT_KEY)
	const binding: ClientNamespaceRouteBinding = {
		method,
		path: readString(operation, X_EDAYA_CLIENT_PATH),
	}

	const pathParams = readStringArray(operation, X_EDAYA_PATH_PARAMS)
	if (pathParams?.length) {
		binding.pathParams = pathParams
	}

	const requestSchemaName = readOptionalString(operation, X_EDAYA_REQUEST_SCHEMA)
	if (requestSchemaName) {
		binding.requestSchemaName = requestSchemaName
	}

	const responseSchemaName = readOptionalString(operation, X_EDAYA_RESPONSE_SCHEMA)
	if (responseSchemaName) {
		binding.responseSchemaName = responseSchemaName
	}

	const basePath = readBasePath(operation)
	if (basePath) {
		binding.basePath = basePath
	}

	if (readBoolean(operation, X_EDAYA_RESPONSE_IS_ARRAY, false)) {
		binding.responseIsArray = true
	}

	return [key, binding]
}

function isClientRouteNamespace(kind: unknown): kind is ClientRouteNamespace {
	return typeof kind === 'string' && CLIENT_ROUTE_NAMESPACES.includes(kind as ClientRouteNamespace)
}

export function extractClientBindingsFromOpenApi(
	openApi: OpenApiDocument,
): ClientBindingsDocument {
	const bindings = createEmptyClientBindingsDocument()

	for (const pathItem of Object.values(openApi.paths ?? {})) {
		for (const method of HTTP_METHODS) {
			const operation = pathItem[method]
			if (!operation) {
				continue
			}

			const kind = operation[X_EDAYA_KIND]
			if (kind === 'entity') {
				const [key, binding] = extractEntityBinding(operation)
				bindings.entities[key] = binding
				continue
			}
			if (kind === 'command') {
				const [key, binding] = extractCommandBinding(operation)
				bindings.commands[key] = binding
				continue
			}
			if (kind === 'query') {
				const [key, binding] = extractQueryBinding(operation)
				bindings.queries[key] = binding
				continue
			}
			if (isClientRouteNamespace(kind)) {
				const [key, binding] = extractNamespaceRouteBinding(
					method.toUpperCase() as ClientNamespaceRouteBinding['method'],
					operation,
				)
				bindings[kind][key] = binding
			}
		}
	}

	if (Object.keys(bindings.entities).length === 0 && openApi.info?.[CLIENT_BINDINGS_OPENAPI_EXTENSION]) {
		const legacy = openApi.info[CLIENT_BINDINGS_OPENAPI_EXTENSION] as Partial<ClientBindingsDocument>
		return {
			...createEmptyClientBindingsDocument(),
			...legacy,
			authorization: legacy.authorization ?? bindings.authorization,
			onboarding: legacy.onboarding ?? bindings.onboarding,
			files: legacy.files ?? bindings.files,
			serviceAccounts: legacy.serviceAccounts ?? bindings.serviceAccounts,
			public: legacy.public ?? bindings.public,
			webhooks: legacy.webhooks ?? bindings.webhooks,
		}
	}

	if (Object.keys(bindings.entities).length === 0) {
		throw new Error(
			'OpenAPI spec has no x-edaya-kind entity operations. Export the API spec after annotating core routes.',
		)
	}

	return bindings
}
