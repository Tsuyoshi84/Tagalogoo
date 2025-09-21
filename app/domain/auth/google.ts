const GOOGLE_REDIRECT_PATH = '/confirm' as const

const BASE_QUERY_PARAMS = {
	access_type: 'offline',
	prompt: 'select_account',
} as const

interface CreateRedirectParams {
	readonly origin: string
	readonly redirectPath?: string
}

export function buildGoogleOAuthRedirect({ origin, redirectPath }: CreateRedirectParams): string {
	const targetPath = redirectPath ?? GOOGLE_REDIRECT_PATH
	const redirectUrl = new URL(origin)
	redirectUrl.pathname = targetPath
	redirectUrl.search = ''
	redirectUrl.hash = ''
	return redirectUrl.toString()
}

export function createGoogleOAuthQueryParams(googleClientId?: string): Record<string, string> {
	if (!googleClientId) {
		return { ...BASE_QUERY_PARAMS }
	}

	return {
		...BASE_QUERY_PARAMS,
		client_id: googleClientId,
	}
}

export { GOOGLE_REDIRECT_PATH }
