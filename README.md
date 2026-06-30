# @edaya/client-codegen

Generate Edaya API client artifacts from an OpenAPI document **only** — no dependency on `@edaya/core` or `apps/api`.

## Install

Consumers pin a release tag from GitHub (no sibling checkout required):

```json
"@edaya/client-codegen": "github:softilab/edaya-client-codegen#v0.0.1"
```

```sh
bun install
```

### Local codegen development

When changing this package before tagging a release, link it into consumer repos:

```sh
cd edaya-client-codegen && bun link
cd ../edaya_web && bun link @edaya/client-codegen
cd ../edaya && bun link @edaya/client-codegen
```

Or temporarily override in a consumer root `package.json`:

```json
"overrides": {
  "@edaya/client-codegen": "file:../edaya-client-codegen"
}
```

Remove the override before opening a PR — CI resolves the git dependency only.

## Releases

Tag semver releases on GitHub; consumer repos pin the tag in `package.json`:

```sh
git tag v0.0.1 && git push origin v0.0.1
```

Then bump the ref in `edaya`, `edaya_web`, and any other consumers:

```json
"@edaya/client-codegen": "github:softilab/edaya-client-codegen#v0.0.1"
```

## CLI

```sh
# From a local file
edaya-codegen generate \
  --input ../edaya/tooling/repo/fixtures/openapi.json \
  --bindings-out ../edaya/package/generated-api-client/src/generated/client-bindings.ts \
  --schema-out ../edaya_web/apps/webapp/src/lib/api/schema.d.ts

# From a URL
edaya-codegen generate \
  --input https://api-staging.edaya.softilab.dev/doc \
  --bindings-out bindings.ts \
  --header "X-Custom-Header: example-value"

# Drift check
edaya-codegen check \
  --input openapi.json \
  --bindings-out packages/api-client/src/generated/client-bindings.ts \
  --schema-out apps/webapp/src/lib/api/schema.d.ts \
  --repo-root .
```

## Programmatic API

```ts
import {
  generateClientArtifacts,
  loadOpenApi,
  extractClientBindingsFromOpenApi,
} from '@edaya/client-codegen'

await generateClientArtifacts({
  input: 'https://api.example.com/doc',
  bindingsOut: 'client-bindings.ts',
  schemaOut: 'schema.d.ts',
})
```

## Inputs

- **Local path** — `openapi.json` or `.yaml` (JSON supported today)
- **URL** — `http://` or `https://` OpenAPI document; optional `--header "Name: value"` (repeatable)

## Outputs

| Flag | Output |
|------|--------|
| `--bindings-out` | `client-bindings.ts` for `@edaya/api-client` |
| `--schema-out` | `schema.d.ts` via `openapi-typescript` |
| `--client-out` | `create-client.ts` with `createSchoolClient()` |
