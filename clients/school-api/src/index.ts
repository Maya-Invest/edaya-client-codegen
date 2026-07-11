export { createSchoolClient, type SchoolClient } from './generated/create-client'
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
