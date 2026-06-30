#!/usr/bin/env bun
import { main } from '../src/cli/index'

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error))
	process.exit(1)
})
