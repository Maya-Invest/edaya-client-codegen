#!/usr/bin/env bun
import process from 'node:process'
import { resolve } from 'node:path'
import { generateClientArtifacts } from '../src/pipeline/generate'

const packageRoot = resolve(import.meta.dirname, '..')
const defaultInput = resolve(packageRoot, '../edaya_backend/tooling/repo/fixtures/openapi.json')
const input = process.argv[2] ?? process.env.OPENAPI_INPUT ?? defaultInput
const clientDir = resolve(packageRoot, 'clients/school-api/src')

await generateClientArtifacts({
	input,
	clientDir,
	schemaOut: resolve(clientDir, 'schema.d.ts'),
})

console.log(`Generated @maya-invest/edaya-api-client from ${input}`)
