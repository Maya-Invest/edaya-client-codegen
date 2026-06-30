import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type {
	ClientBindingsDocument,
	ClientNamespaceRouteBinding,
} from '../contract/bindings'
import { CLIENT_ROUTE_NAMESPACES } from '../contract/extensions'
import type { ClientRouteNamespace } from '../contract/extensions'
import { DEFAULT_CLIENT_BANNER } from './banners'

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1)
}

function responseType(binding: ClientNamespaceRouteBinding): string {
	if (!binding.responseSchemaName) {
		return 'unknown'
	}
	const schema = `SchemaName<TSchemas, '${binding.responseSchemaName}'>`
	return binding.responseIsArray ? `${schema}[]` : schema
}

function paramsType(binding: ClientNamespaceRouteBinding): string | undefined {
	if (!binding.pathParams?.length) {
		return undefined
	}
	const fields = binding.pathParams.map(param => `${param}: string`).join(', ')
	return `{ ${fields} }`
}

function namespaceMethodType(
	key: string,
	binding: ClientNamespaceRouteBinding,
): string {
	const params = paramsType(binding)
	const hasBody = Boolean(binding.requestSchemaName)
	const returnType = responseType(binding)

	if (params && hasBody) {
		return `${key}: (params: ${params}, payload: SchemaName<TSchemas, '${binding.requestSchemaName}'>) => Promise<${returnType}>`
	}
	if (params) {
		return `${key}: (params: ${params}) => Promise<${returnType}>`
	}
	if (hasBody) {
		return `${key}: (payload: SchemaName<TSchemas, '${binding.requestSchemaName}'>) => Promise<${returnType}>`
	}
	return `${key}: () => Promise<${returnType}>`
}

function resolvePathArguments(binding: ClientNamespaceRouteBinding): string {
	const args = [`'${binding.path}'`]
	if (binding.pathParams?.length) {
		args.push('params')
	}
	else if (binding.basePath === 'root') {
		args.push('{}')
	}
	if (binding.basePath === 'root') {
		args.push(`'root'`)
	}
	return args.join(', ')
}

function namespaceMethodImplementation(
	key: string,
	binding: ClientNamespaceRouteBinding,
): string {
	const params = paramsType(binding)
	const hasBody = Boolean(binding.requestSchemaName)
	const pathArgs = resolvePathArguments(binding)
	const request = hasBody
		? `transport.request('${binding.method}', resolveClientRoutePath(${pathArgs}), { body: payload })`
		: `transport.request('${binding.method}', resolveClientRoutePath(${pathArgs}))`

	if (params && hasBody) {
		return `${key}: (params: ${params}, payload: SchemaName<TSchemas, '${binding.requestSchemaName}'>) => ${request}`
	}
	if (params) {
		return `${key}: (params: ${params}) => ${request}`
	}
	if (hasBody) {
		return `${key}: (payload: SchemaName<TSchemas, '${binding.requestSchemaName}'>) => ${request}`
	}
	return `${key}: () => ${request}`
}

function buildNamespaceTypes(
	namespace: ClientRouteNamespace,
	routes: Record<string, ClientNamespaceRouteBinding>,
): string {
	const entries = Object.entries(routes)
	if (entries.length === 0) {
		return `type ${capitalize(namespace)}Clients<TSchemas extends Record<string, unknown>> = Record<string, never>`
	}

	const methods = entries
		.map(([key, binding]) => `  ${namespaceMethodType(key, binding)}`)
		.join('\n')

	return `type ${capitalize(namespace)}Clients<TSchemas extends Record<string, unknown>> = {\n${methods}\n}`
}

function buildNamespaceImplementation(
	namespace: ClientRouteNamespace,
	routes: Record<string, ClientNamespaceRouteBinding>,
): string {
	const entries = Object.entries(routes)
	const typeName = `${capitalize(namespace)}Clients<TSchemas>`
	if (entries.length === 0) {
		return `{} as ${typeName}`
	}

	const methods = entries
		.map(([key, binding]) => `    ${namespaceMethodImplementation(key, binding)},`)
		.join('\n')

	return `{\n${methods}\n  } as ${typeName}`
}

export function formatCreateClientTypeScript(
	bindings: ClientBindingsDocument,
	options: { banner?: string } = {},
): string {
	const banner = options.banner ?? DEFAULT_CLIENT_BANNER
	const namespaceTypes = CLIENT_ROUTE_NAMESPACES
		.map(namespace => buildNamespaceTypes(namespace, bindings[namespace]))
		.join('\n\n')
	const namespaceFields = CLIENT_ROUTE_NAMESPACES
		.map(namespace => `  ${namespace}: ${capitalize(namespace)}Clients<TSchemas>`)
		.join('\n')
	const namespaceAssignments = CLIENT_ROUTE_NAMESPACES
		.map(namespace => `    ${namespace}: ${buildNamespaceImplementation(namespace, bindings[namespace])},`)
		.join('\n')

	return `${banner}
import type { BaseEntityResource, DirectSaveEntityResource } from '../entity-resource'
import type { Transport } from '../transport'
import { EntityResource } from '../entity-resource'
import { clientBindings } from './client-bindings'
import { resolveClientRoutePath } from '../paths'

type SchemaName<TSchemas extends Record<string, unknown>, TName extends string>
  = TName extends keyof TSchemas ? TSchemas[TName] : never

type EntityClient<
  TSchemas extends Record<string, unknown>,
  TBinding extends { schemaName: string, allowDirectSave: boolean },
> = TBinding['allowDirectSave'] extends true
  ? DirectSaveEntityResource<SchemaName<TSchemas, TBinding['schemaName']>>
  : BaseEntityResource<SchemaName<TSchemas, TBinding['schemaName']>>

type EntityClients<TSchemas extends Record<string, unknown>> = {
  [K in keyof typeof clientBindings.entities]: EntityClient<
    TSchemas,
    typeof clientBindings.entities[K]
  >
}

type CommandClients<TSchemas extends Record<string, unknown>> = {
  [K in keyof typeof clientBindings.commands]: (
    payload: SchemaName<TSchemas, typeof clientBindings.commands[K]['requestSchemaName']>,
  ) => Promise<SchemaName<TSchemas, typeof clientBindings.commands[K]['responseSchemaName']>>
}

type QueryClients<TSchemas extends Record<string, unknown>> = {
  [K in keyof typeof clientBindings.queries]: (
    payload: SchemaName<TSchemas, typeof clientBindings.queries[K]['requestSchemaName']>,
  ) => Promise<SchemaName<TSchemas, typeof clientBindings.queries[K]['responseSchemaName']>>
}

${namespaceTypes}

export interface SchoolClient<TSchemas extends Record<string, unknown>> {
  entities: EntityClients<TSchemas>
  commands: CommandClients<TSchemas>
  queries: QueryClients<TSchemas>
${namespaceFields}
}

export function createSchoolClient<TSchemas extends Record<string, unknown>>(
  transport: Transport,
): SchoolClient<TSchemas> {
  const entities = Object.fromEntries(
    Object.entries(clientBindings.entities).map(([key, binding]) => [
      key,
      new EntityResource(transport, binding.publicName),
    ]),
  ) as unknown as EntityClients<TSchemas>

  const commands = Object.fromEntries(
    Object.entries(clientBindings.commands).map(([key, binding]) => [
      key,
      (payload: unknown) =>
        transport.request(
          'POST',
          resolveClientRoutePath(\`commands/\${binding.publicName}\`),
          { body: payload },
        ),
    ]),
  ) as CommandClients<TSchemas>

  const queries = Object.fromEntries(
    Object.entries(clientBindings.queries).map(([key, binding]) => [
      key,
      (payload: unknown) =>
        transport.request(
          'POST',
          resolveClientRoutePath(\`queries/\${binding.publicName}\`),
          { body: payload },
        ),
    ]),
  ) as QueryClients<TSchemas>

  return {
    entities,
    commands,
    queries,
${namespaceAssignments}
  }
}
`
}

export function writeCreateClientTypeScript(
	bindings: ClientBindingsDocument,
	outputPath: string,
	options: { banner?: string } = {},
): void {
	mkdirSync(dirname(outputPath), { recursive: true })
	writeFileSync(outputPath, formatCreateClientTypeScript(bindings, options))
}
