// @edaya/client-codegen runtime
/** Must stay aligned with apps/api/src/lib/school-api/routes/paths.ts */
export const SCHOOL_API_BASE_PATH = '/core'

export function schoolApiPath(...segments: string[]): string {
	return `${SCHOOL_API_BASE_PATH}/${segments.join('/')}`
}

export function resolveClientRoutePath(
	pathTemplate: string,
	params: Record<string, string> = {},
	basePath: 'core' | 'root' = 'core',
): string {
	const segments = pathTemplate.split('/').map((segment) => {
		if (segment.startsWith('{') && segment.endsWith('}')) {
			const paramName = segment.slice(1, -1)
			const value = params[paramName]
			if (!value) {
				throw new Error(`Missing path param ${paramName}`)
			}
			return value
		}
		return segment
	})

	if (basePath === 'root') {
		return `/${segments.join('/')}`
	}

	return schoolApiPath(...segments)
}
