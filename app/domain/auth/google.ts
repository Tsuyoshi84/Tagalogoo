/** Default redirect path for Google OAuth authentication */
const GOOGLE_REDIRECT_PATH = '/confirm' as const

/** Base query parameters for Google OAuth requests */
const BASE_QUERY_PARAMS = {
	access_type: 'offline',
	prompt: 'select_account',
} as const

/**
 * Parameters for creating Google OAuth redirect URL
 */
interface CreateRedirectParams {
	/** The origin URL of the application (e.g., 'https://example.com') */
	readonly origin: string
	/** Optional custom redirect path (defaults to GOOGLE_REDIRECT_PATH) */
	readonly redirectPath?: string
}

/**
 * Builds a Google OAuth redirect URL for Supabase authentication
 *
 * Creates a clean redirect URL by combining the origin with the target path
 * and removing any existing query parameters or hash fragments.
 *
 * @param params - Configuration for building the redirect URL
 * @param params.origin - The base origin URL (e.g., 'https://example.com')
 * @param params.redirectPath - Optional custom redirect path (defaults to '/confirm')
 * @returns The complete redirect URL as a string
 *
 * @example
 * ```typescript
 * // Using default redirect path
 * const url = buildGoogleOAuthRedirect({ origin: 'https://myapp.com' })
 * // Returns: 'https://myapp.com/confirm'
 *
 * // Using custom redirect path
 * const url = buildGoogleOAuthRedirect({
 *   origin: 'https://myapp.com',
 *   redirectPath: '/auth/callback'
 * })
 * // Returns: 'https://myapp.com/auth/callback'
 * ```
 */
export function buildGoogleOAuthRedirect({ origin, redirectPath }: CreateRedirectParams): string {
	const targetPath = redirectPath ?? GOOGLE_REDIRECT_PATH
	const redirectUrl = new URL(origin)
	redirectUrl.pathname = targetPath
	redirectUrl.search = ''
	redirectUrl.hash = ''
	return redirectUrl.toString()
}

/**
 * Creates query parameters for Google OAuth requests
 *
 * Combines base OAuth parameters with an optional Google client ID.
 * The base parameters include 'access_type: offline' and 'prompt: select_account'
 * for optimal OAuth flow behavior.
 *
 * @param googleClientId - Optional Google OAuth client ID
 * @returns Object containing query parameters for Google OAuth
 *
 * @example
 * ```typescript
 * // Without client ID
 * const params = createGoogleOAuthQueryParams()
 * // Returns: { access_type: 'offline', prompt: 'select_account' }
 *
 * // With client ID
 * const params = createGoogleOAuthQueryParams('1234567890.apps.googleusercontent.com')
 * // Returns: {
 * //   access_type: 'offline',
 * //   prompt: 'select_account',
 * //   client_id: '1234567890.apps.googleusercontent.com'
 * // }
 * ```
 */
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
