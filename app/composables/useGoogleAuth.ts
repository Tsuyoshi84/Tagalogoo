import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useRuntimeConfig, useSupabaseClient, useSupabaseUser } from '#imports'
import { buildGoogleOAuthRedirect } from '~/domain/auth/google.ts'

/**
 * Return type for the useGoogleAuth composable
 */
interface UseGoogleAuthReturnType {
	/** Function to initiate Google OAuth sign-in */
	readonly signInWithGoogle: () => Promise<void>
	/** Function to sign out the current user */
	readonly signOut: () => Promise<void>
	/** Reactive state indicating if an auth operation is in progress */
	readonly isPending: Ref<boolean>
	/** Reactive state containing any error message from auth operations */
	readonly errorMessage: Ref<string | null>
	/** Computed reactive state indicating if user is authenticated */
	readonly isAuthenticated: ComputedRef<boolean>
	/** The current user object from Supabase */
	readonly user: ReturnType<typeof useSupabaseUser>
}

/**
 * Converts an unknown error into a user-friendly error message
 * @param error - The error to convert
 * @returns A string error message
 */
function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}

	if (typeof error === 'string') {
		return error
	}

	return 'Something went wrong while contacting Google. Please try again.'
}

/**
 * Composable for Google OAuth authentication with Supabase
 *
 * Provides reactive state management for Google sign-in/sign-out operations,
 * including loading states, error handling, and authentication status.
 *
 * @returns Object containing authentication methods and reactive state
 *
 * @example
 * ```vue
 * <script setup>
 * const { signInWithGoogle, signOut, isPending, errorMessage, isAuthenticated, user } = useGoogleAuth()
 *
 * async function handleSignIn() {
 *   await signInWithGoogle()
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button v-if="!isAuthenticated" @click="handleSignIn" :disabled="isPending">
 *       Sign in with Google
 *     </button>
 *     <button v-else @click="signOut">
 *       Sign out
 *     </button>
 *     <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useGoogleAuth(): UseGoogleAuthReturnType {
	const supabaseClient = useSupabaseClient()
	const user = useSupabaseUser()
	const isPending = ref(false)
	const errorMessage = ref<string | null>(null)
	const runtimeConfig = useRuntimeConfig()

	const isAuthenticated = computed<boolean>(() => user.value !== null)

	/**
	 * Initiates Google OAuth sign-in process
	 *
	 * Redirects the user to Google's OAuth consent screen. After successful
	 * authentication, the user will be redirected back to the application.
	 * Only runs on the client side.
	 *
	 * @throws Will set errorMessage if authentication fails
	 */
	async function signInWithGoogle(): Promise<void> {
		if (!import.meta.client) {
			return
		}

		isPending.value = true
		errorMessage.value = null

		try {
			const redirectPath = runtimeConfig.public.supabase?.redirectOptions?.callback as
				| string
				| undefined
			const redirectTo = buildGoogleOAuthRedirect({
				origin: window.location.origin,
				redirectPath,
			})

			const { error } = await supabaseClient.auth.signInWithOAuth({
				options: {
					redirectTo,
				},
				provider: 'google',
			})

			if (error) {
				throw error
			}
		} catch (error) {
			errorMessage.value = toErrorMessage(error)
		} finally {
			isPending.value = false
		}
	}

	/**
	 * Signs out the current user
	 *
	 * Clears the user session and removes authentication state.
	 * If an error occurs during sign-out, it will be set in errorMessage
	 * and the error will be re-thrown.
	 *
	 * @throws Will re-throw any error from Supabase sign-out operation
	 */
	async function signOut(): Promise<void> {
		errorMessage.value = null

		const { error } = await supabaseClient.auth.signOut()

		if (error) {
			errorMessage.value = toErrorMessage(error)
			throw error
		}
	}

	return {
		errorMessage,
		isAuthenticated,
		isPending,
		signInWithGoogle,
		signOut,
		user,
	}
}
