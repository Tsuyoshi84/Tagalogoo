import { onUnmounted, readonly, ref } from 'vue'

/**
 * Audio playback state interface
 */
export interface AudioState {
	isPlaying: boolean
	isLoading: boolean
	duration: number
	currentTime: number
	volume: number
	error: string | null
}

/**
 * Audio playback events interface
 */
export interface AudioEvents {
	onPlay?: () => void
	onPause?: () => void
	onEnded?: () => void
	onError?: (error: string) => void
	onLoadStart?: () => void
	onLoadEnd?: () => void
	onTimeUpdate?: (currentTime: number, duration: number) => void
}

/**
 * Composable for audio playback functionality
 */
export function useAudioPlayback(events: AudioEvents = {}) {
	// Reactive state
	const audioState = ref<AudioState>({
		isPlaying: false,
		isLoading: false,
		duration: 0,
		currentTime: 0,
		volume: 1.0,
		error: null,
	})

	// Audio element reference
	const audioElement = ref<HTMLAudioElement | null>(null)
	const currentAudioUrl = ref<string | null>(null)

	/**
	 * Initialize audio element with event listeners
	 */
	const initializeAudio = (audioUrl: string): HTMLAudioElement => {
		// Clean up existing audio
		if (audioElement.value) {
			cleanupAudio()
		}

		const audio = new Audio()
		audioElement.value = audio
		currentAudioUrl.value = audioUrl

		// Set up event listeners
		audio.addEventListener('loadstart', handleLoadStart)
		audio.addEventListener('canplaythrough', handleLoadEnd)
		audio.addEventListener('play', handlePlay)
		audio.addEventListener('pause', handlePause)
		audio.addEventListener('ended', handleEnded)
		audio.addEventListener('error', handleError)
		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('durationchange', handleDurationChange)

		// Set initial volume
		audio.volume = audioState.value.volume

		return audio
	}

	/**
	 * Event handlers
	 */
	const handleLoadStart = () => {
		audioState.value.isLoading = true
		audioState.value.error = null
		events.onLoadStart?.()
	}

	const handleLoadEnd = () => {
		audioState.value.isLoading = false
		events.onLoadEnd?.()
	}

	const handlePlay = () => {
		audioState.value.isPlaying = true
		events.onPlay?.()
	}

	const handlePause = () => {
		audioState.value.isPlaying = false
		events.onPause?.()
	}

	const handleEnded = () => {
		audioState.value.isPlaying = false
		audioState.value.currentTime = 0
		events.onEnded?.()
	}

	const handleError = (event: Event) => {
		const audio = event.target as HTMLAudioElement
		let errorMessage = 'Audio playback failed'

		if (audio.error) {
			switch (audio.error.code) {
				case MediaError.MEDIA_ERR_ABORTED:
					errorMessage = 'Audio playback was aborted'
					break
				case MediaError.MEDIA_ERR_NETWORK:
					errorMessage = 'Network error occurred while loading audio'
					break
				case MediaError.MEDIA_ERR_DECODE:
					errorMessage = 'Audio file could not be decoded'
					break
				case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
					errorMessage = 'Audio format not supported'
					break
				default:
					errorMessage = 'Unknown audio error occurred'
			}
		}

		audioState.value.error = errorMessage
		audioState.value.isPlaying = false
		audioState.value.isLoading = false
		events.onError?.(errorMessage)
	}

	const handleTimeUpdate = () => {
		if (audioElement.value) {
			audioState.value.currentTime = audioElement.value.currentTime
			events.onTimeUpdate?.(audioElement.value.currentTime, audioElement.value.duration || 0)
		}
	}

	const handleDurationChange = () => {
		if (audioElement.value) {
			audioState.value.duration = audioElement.value.duration || 0
		}
	}

	/**
	 * Play audio from URL
	 */
	const playAudio = async (audioUrl: string): Promise<void> => {
		try {
			audioState.value.error = null

			// Initialize new audio if URL changed or no audio exists
			if (!audioElement.value || currentAudioUrl.value !== audioUrl) {
				const audio = initializeAudio(audioUrl)
				audio.src = audioUrl
			}

			// Play the audio
			if (audioElement.value) {
				await audioElement.value.play()
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to play audio'
			audioState.value.error = errorMessage
			audioState.value.isPlaying = false
			audioState.value.isLoading = false
			events.onError?.(errorMessage)
			throw new Error(errorMessage)
		}
	}

	/**
	 * Pause audio playback
	 */
	const pauseAudio = (): void => {
		if (audioElement.value && !audioElement.value.paused) {
			audioElement.value.pause()
		}
	}

	/**
	 * Stop audio playback and reset position
	 */
	const stopAudio = (): void => {
		if (audioElement.value) {
			audioElement.value.pause()
			audioElement.value.currentTime = 0
		}
	}

	/**
	 * Toggle play/pause
	 */
	const togglePlayback = async (audioUrl?: string): Promise<void> => {
		if (audioState.value.isPlaying) {
			pauseAudio()
		} else if (audioUrl) {
			await playAudio(audioUrl)
		} else if (audioElement.value && currentAudioUrl.value) {
			await playAudio(currentAudioUrl.value)
		}
	}

	/**
	 * Set audio volume (0.0 to 1.0)
	 */
	const setVolume = (volume: number): void => {
		const clampedVolume = Math.max(0, Math.min(1, volume))
		audioState.value.volume = clampedVolume

		if (audioElement.value) {
			audioElement.value.volume = clampedVolume
		}
	}

	/**
	 * Seek to specific time position
	 */
	const seekTo = (time: number): void => {
		if (audioElement.value?.duration) {
			const clampedTime = Math.max(0, Math.min(audioElement.value.duration, time))
			audioElement.value.currentTime = clampedTime
		}
	}

	/**
	 * Check if audio URL is valid and accessible
	 */
	const validateAudioUrl = (audioUrl: string): Promise<boolean> => {
		try {
			const audio = new Audio()

			return new Promise((resolve) => {
				const timeout = setTimeout(() => {
					resolve(false)
				}, 5000) // 5 second timeout

				audio.addEventListener('canplaythrough', () => {
					clearTimeout(timeout)
					resolve(true)
				})

				audio.addEventListener('error', () => {
					clearTimeout(timeout)
					resolve(false)
				})

				audio.src = audioUrl
			})
		} catch {
			return Promise.resolve(false)
		}
	}

	/**
	 * Preload audio for faster playback
	 */
	const preloadAudio = (audioUrl: string): void => {
		try {
			const audio = initializeAudio(audioUrl)
			audio.src = audioUrl
			audio.preload = 'auto'
		} catch (_error) {
			// Silently handle preload errors
		}
	}

	/**
	 * Get formatted time string (MM:SS)
	 */
	const formatTime = (seconds: number): string => {
		if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = Math.floor(seconds % 60)
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	/**
	 * Get current playback progress as percentage
	 */
	const getProgress = (): number => {
		if (!audioState.value.duration || audioState.value.duration === 0) return 0
		return (audioState.value.currentTime / audioState.value.duration) * 100
	}

	/**
	 * Clean up audio resources
	 */
	const cleanupAudio = (): void => {
		if (audioElement.value) {
			// Remove event listeners
			audioElement.value.removeEventListener('loadstart', handleLoadStart)
			audioElement.value.removeEventListener('canplaythrough', handleLoadEnd)
			audioElement.value.removeEventListener('play', handlePlay)
			audioElement.value.removeEventListener('pause', handlePause)
			audioElement.value.removeEventListener('ended', handleEnded)
			audioElement.value.removeEventListener('error', handleError)
			audioElement.value.removeEventListener('timeupdate', handleTimeUpdate)
			audioElement.value.removeEventListener('durationchange', handleDurationChange)

			// Stop and clean up
			audioElement.value.pause()
			audioElement.value.src = ''
			audioElement.value = null
		}

		currentAudioUrl.value = null
		audioState.value.isPlaying = false
		audioState.value.isLoading = false
		audioState.value.currentTime = 0
		audioState.value.duration = 0
		audioState.value.error = null
	}

	/**
	 * Cleanup on unmount
	 */
	onUnmounted(() => {
		cleanupAudio()
	})

	return {
		// State
		audioState: readonly(audioState),
		currentAudioUrl: readonly(currentAudioUrl),

		// Actions
		playAudio,
		pauseAudio,
		stopAudio,
		togglePlayback,
		setVolume,
		seekTo,
		preloadAudio,

		// Utilities
		validateAudioUrl,
		formatTime,
		getProgress,
		cleanupAudio,
	}
}
