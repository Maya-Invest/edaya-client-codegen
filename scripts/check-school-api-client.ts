#!/usr/bin/env bun
import process from 'node:process'
import { resolve } from 'node:path'
import { checkClientArtifacts } from '../src/pipeline/check'

const packageRoot = resolve(import.meta.dirname, '..')
const clientDir = resolve(packageRoot, 'clients/school-api/src')
const openApiPath = resolve(clientDir, 'openapi.json')

const changed = await checkClientArtifacts({
	input: openApiPath,
	clientDir,
	repoRoot: packageRoot,
})

if (changed.length > 0) {
	console.error('clients/school-api/src is out of date. Run `bun run generate:client` and commit the changes.')
	console.error('Changed files:')
	for (const path of changed) {
		console.error(`  - ${path}`)
	}
	process.exit(1)
}

console.log('clients/school-api/src is up to date.')
