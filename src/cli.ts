#!/usr/bin/env bun
import process from 'node:process'
import { checkClientArtifacts, generateClientArtifacts } from './generate.ts'

interface ParsedCli {
	command?: string
	input?: string
	bindingsOut?: string
	schemaOut?: string
	clientOut?: string
	openApiOut?: string
	repoRoot?: string
	headers: Record<string, string>
}

function printUsage(): void {
	console.log(`Usage:
  edaya-codegen generate --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--header "Name: value"]
  edaya-codegen check --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--openapi-out path] [--repo-root path] [--header "Name: value"]

Examples:
  edaya-codegen generate --input openapi.json --bindings-out src/generated/client-bindings.ts --schema-out src/schema.d.ts --client-out src/generated/create-client.ts
  edaya-codegen generate --input https://api.example.com/doc --bindings-out bindings.ts --client-out create-client.ts
  edaya-codegen check --input openapi.json --bindings-out src/generated/client-bindings.ts --client-out src/generated/create-client.ts --repo-root .`)
}

function parseHeaderValue(value: string): [string, string] {
	const separatorIndex = value.indexOf(':')
	if (separatorIndex === -1) {
		throw new Error(`Invalid header format "${value}". Expected "Name: value".`)
	}
	const name = value.slice(0, separatorIndex).trim()
	const headerValue = value.slice(separatorIndex + 1).trim()
	if (!name) {
		throw new Error(`Invalid header format "${value}". Expected "Name: value".`)
	}
	return [name, headerValue]
}

function parseCli(argv: string[]): ParsedCli {
	const parsed: ParsedCli = { headers: {} }

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index]
		if (token === 'generate' || token === 'check') {
			parsed.command = token
			continue
		}

		const readValue = (): string => {
			const value = argv[index + 1]
			if (!value || value.startsWith('--')) {
				throw new Error(`${token} requires a value`)
			}
			index += 1
			return value
		}

		switch (token) {
			case '--input':
				parsed.input = readValue()
				break
			case '--bindings-out':
				parsed.bindingsOut = readValue()
				break
			case '--schema-out':
				parsed.schemaOut = readValue()
				break
			case '--client-out':
				parsed.clientOut = readValue()
				break
			case '--openapi-out':
				parsed.openApiOut = readValue()
				break
			case '--repo-root':
				parsed.repoRoot = readValue()
				break
			case '--header': {
				const [name, value] = parseHeaderValue(readValue())
				parsed.headers[name] = value
				break
			}
			default:
				throw new Error(`Unknown argument: ${token}`)
		}
	}

	return parsed
}

async function main(): Promise<void> {
	let parsed: ParsedCli
	try {
		parsed = parseCli(process.argv.slice(2))
	}
	catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		printUsage()
		process.exit(1)
	}

	if (!parsed.command || !parsed.input) {
		printUsage()
		process.exit(1)
	}

	if (parsed.command === 'generate') {
		if (!parsed.bindingsOut && !parsed.schemaOut && !parsed.clientOut) {
			console.error('generate requires at least one of --bindings-out, --schema-out, or --client-out')
			process.exit(1)
		}

		await generateClientArtifacts({
			input: parsed.input,
			bindingsOut: parsed.bindingsOut,
			schemaOut: parsed.schemaOut,
			clientOut: parsed.clientOut,
			headers: parsed.headers,
		})
		console.log('Generated client artifacts updated.')
		return
	}

	const changed = await checkClientArtifacts({
		input: parsed.input,
		bindingsOut: parsed.bindingsOut,
		schemaOut: parsed.schemaOut,
		clientOut: parsed.clientOut,
		openApiOut: parsed.openApiOut,
		repoRoot: parsed.repoRoot,
		headers: parsed.headers,
	})

	if (changed.length > 0) {
		console.error('Generated client artifacts are out of date. Run `edaya-codegen generate` and commit the changes.')
		console.error('Changed files:')
		for (const path of changed) {
			console.error(`  - ${path}`)
		}
		process.exit(1)
	}

	console.log('Generated client artifacts are up to date.')
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	})
}
