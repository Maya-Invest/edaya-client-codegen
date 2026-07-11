# @edaya/client-codegen

Generate Edaya API client artifacts from an OpenAPI document **only** — no dependency on `@edaya/core` or `apps/api`.

## Install

Consumers pin the `dev` branch from GitHub (no sibling checkout required):

```json
"@edaya/client-codegen": "github:Maya-Invest/edaya-client-codegen#dev"
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

For stable consumer installs, tag semver releases and pin the tag instead of `#dev`:

```sh
git tag v0.0.1 && git push origin v0.0.1
```

```json
"@edaya/client-codegen": "github:Maya-Invest/edaya-client-codegen#v0.0.1"
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
| `--bindings-out` | `client-bindings.ts` for `@maya-invest/edaya-api-client` |
| `--schema-out` | `schema.d.ts` via `openapi-typescript` |
| `--client-out` | `create-client.ts` with `createSchoolClient()` |


## @maya-invest/edaya-api-client (GitHub Packages)

Published school API client generated into [`clients/school-api/`](clients/school-api/).

| Install | Command |
|---------|---------|
| GitHub Packages (staging) | `bun add @maya-invest/edaya-api-client@staging` with `.npmrc` → `npm.pkg.github.com` |
| GitHub Packages (production) | `bun add @maya-invest/edaya-api-client@production` |
| Local path | `"@maya-invest/edaya-api-client": "file:../edaya-client-codegen/clients/school-api"` |

Local path installs resolve the TypeScript barrel (`src/index.ts`). Published npm tarballs ship compiled ESM from `dist/`.

### Regenerate locally

```sh
bun run generate:client
# optional input:
OPENAPI_INPUT=../edaya_backend/tooling/repo/fixtures/openapi.json bun run generate:client
bun run build:client
bun run check:client
```

### CI publish

On merge to `staging` or `main` in **edaya_backend** (when API paths change), `deploy_push` runs `_publish-api-client.yml`:

1. Export OpenAPI in-process from the merged API (`bun repo openapi export`)
2. Regenerate `clients/school-api/src` in this repo
3. Commit + push to the matching branch (`staging` / `main`)
4. Build `dist/` and `npm publish --tag staging|production`

Publish uses `GITHUB_TOKEN` on `edaya_backend`; optional `CODEGEN_REPO_TOKEN` to commit regenerated sources.
