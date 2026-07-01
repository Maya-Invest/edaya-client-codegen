export interface GeneratedArtifact {
	generated: string
	tracked: string
}

export interface GenerateArtifactsOptions {
	input: string
	bindingsOut?: string
	schemaOut?: string
	clientOut?: string
	clientDir?: string
	runtimeVersion?: string
	headers?: Record<string, string>
	bindingsBanner?: string
	clientBanner?: string
}

export interface CheckArtifactsOptions extends GenerateArtifactsOptions {
	repoRoot?: string
	openApiOut?: string
}
