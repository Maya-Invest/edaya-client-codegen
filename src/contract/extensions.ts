/** OpenAPI `info` extension key for legacy bundled bindings (prefer per-operation `x-edaya-*`). */
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
export const X_EDAYA_NAMESPACE_KEY = 'x-edaya-namespace-key'

export const CORE_CLIENT_BINDING_KINDS = ['entity', 'command', 'query', 'namespace'] as const
