import process from 'node:process'
import { join } from 'node:path'
import { checkClientArtifacts } from '../pipeline/check'
import { generateClientArtifacts } from '../pipeline/generate'
import { parseCli } from './parse-args'
import { printUsage } from './usage'

export async function main(): Promise<void> {
	let parsed
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

	const hasLegacyOutputs = Boolean(parsed.bindingsOut || parsed.schemaOut || parsed.clientOut)
	const hasClientDir = Boolean(parsed.clientDir)

	if (parsed.command === 'generate') {
		if (!hasLegacyOutputs && !hasClientDir) {
			console.error('generate requires --client-dir or at least one of --bindings-out, --schema-out, or --client-out')
			process.exit(1)
		}

		await generateClientArtifacts({
			input: parsed.input,
			bindingsOut: parsed.bindingsOut,
			schemaOut: parsed.schemaOut,
			clientOut: parsed.clientOut,
			clientDir: parsed.clientDir,
			runtimeVersion: parsed.runtimeVersion,
			headers: parsed.headers,
		})
		console.log('Generated client artifacts updated.')
		return
	}

	const changed = await checkClientArtifacts({
		input: parsed.input,
		bindingsOut: parsed.bindingsOut,
		schemaOut: parsed.schemaOut ?? (parsed.clientDir ? join(parsed.clientDir, 'schema.d.ts') : undefined),
		clientOut: parsed.clientOut,
		clientDir: parsed.clientDir,
		runtimeVersion: parsed.runtimeVersion,
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
