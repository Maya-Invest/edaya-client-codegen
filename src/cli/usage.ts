export function printUsage(): void {
	console.log(`Usage:
  edaya-codegen generate --input <file|url> --client-dir <path> [--schema-out path] [--runtime-version semver] [--header "Name: value"]
  edaya-codegen generate --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--header "Name: value"]
  edaya-codegen check --input <file|url> --client-dir <path> [--schema-out path] [--repo-root path] [--header "Name: value"]
  edaya-codegen check --input <file|url> [--bindings-out path] [--schema-out path] [--client-out path] [--openapi-out path] [--repo-root path] [--header "Name: value"]

Examples:
  edaya-codegen generate --input openapi.json --client-dir src/generated/api-client
  edaya-codegen generate --input https://api.example.com/doc --client-dir packages/api-client --header "Authorization: Bearer token"
  edaya-codegen check --input openapi.json --client-dir src/generated/api-client --repo-root .`)
}
