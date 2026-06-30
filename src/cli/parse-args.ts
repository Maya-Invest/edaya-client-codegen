export interface ParsedCli {
	command?: string
	input?: string
	bindingsOut?: string
	schemaOut?: string
	clientOut?: string
	openApiOut?: string
	repoRoot?: string
	headers: Record<string, string>
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

export function parseCli(argv: string[]): ParsedCli {
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
