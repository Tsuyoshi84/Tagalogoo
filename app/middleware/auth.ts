/**
 * Authentication middleware
 * Redirects unauthenticated users to the login page
 */
export default defineNuxtRouteMiddleware(() => {
	const user = useSupabaseUser()

	// If user is not authenticated, redirect to login
	if (!user.value) {
		return navigateTo('/login')
	}
})
