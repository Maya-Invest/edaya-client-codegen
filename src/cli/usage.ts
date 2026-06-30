export function printUsage(): void {
	console.log(`Usage:
  edaya-codegen generate --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--header "Name: value"]
  edaya-codegen check --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--openapi-out path] [--repo-root path] [--header "Name: value"]

Examples:
  edaya-codegen generate --input openapi.json --bindings-out src/generated/client-bindings.ts --schema-out src/schema.d.ts --client-out src/generated/create-client.ts
  edaya-codegen generate --input https://api.example.com/doc --bindings-out bindings.ts --client-out create-client.ts
  edaya-codegen check --input openapi.json --bindings-out src/generated/client-bindings.ts --client-out src/generated/create-client.ts --repo-root .`)
}
