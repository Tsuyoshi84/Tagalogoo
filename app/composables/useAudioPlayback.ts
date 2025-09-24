import { computed, onUnmounted, type Ref, readonly, ref } from 'vue'

/**
 * Audio playback state information
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
 * Audio playback events
 */
export interface AudioEvents {
	onPlay?: () => void
	onPause?: () => void
	onEnded?: () => void
	onError?: (error: string) => void
	onLoadStart?: () => void
	onLoadEnd?: () => void
}

/**
 * Composable for managing audio playback functionality
 *
 * Provides reactive state management for audio playback including:
 * - Audio loading and playback controls
 * - Error handling for missing or failed audio files
 * - Visual feedback for audio playback state
 * - Volume control and progress tracking
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   audioState,
 *   playAudio,
 *   pauseAudio,
 *   stopAudio,
 *   setVolume
 * } = useAudioPlayback({
 *   onPlay: () => console.log('Audio started'),
 *   onError: (error) => console.error('Audio error:', error)
 * })
 *
 * // Play an audio file
 * await playAudio('https://example.com/audio.mp3')
 *
 * // Control playback
 * pauseAudio()
 * stopAudio()
 * setVolume(0.5)
 * </script>
 * ```
 */
export function useAudioPlayback(events: AudioEvents = {}) {
	// Audio element reference
	const currentAudio: Ref<HTMLAudioElement | null> = ref(null)
	const currentUrl: Ref<string | null> = ref(null)

	// Reactive audio state
	const audioState: Ref<AudioState> = ref({
		isPlaying: false,
		isLoading: false,
		duration: 0,
		currentTime: 0,
		volume: 1.0,
		error: null,
	})

	// Computed properties
	const canPlay = computed(() => {
		return !!currentAudio.value && !audioState.value.error && !audioState.value.isLoading
	})

	const progress = computed(() => {
		if (audioState.value.duration === 0) return 0
		return (audioState.value.currentTime / audioState.value.duration) * 100
	})

	const isAudioSupported = computed(() => {
		return typeof Audio !== 'undefined'
	})

	/**
	 * Create and configure a new audio element
	 *
	 * Sets up event listeners and configures the audio element for playback.
	 *
	 * @param url - URL of the audio file to load
	 * @returns Configured HTMLAudioElement
	 */
	function createAudioElement(_url: string): HTMLAudioElement {
		const audio = new Audio()

		// Configure audio element
		audio.preload = 'metadata'
		audio.volume = audioState.value.volume

		// Set up event listeners
		audio.addEventListener('loadstart', handleLoadStart)
		audio.addEventListener('loadedmetadata', handleLoadedMetadata)
		audio.addEventListener('canplay', handleCanPlay)
		audio.addEventListener('play', handlePlay)
		audio.addEventListener('pause', handlePause)
		audio.addEventListener('ended', handleEnded)
		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('error', handleError)
		audio.addEventListener('abort', handleAbort)
		audio.addEventListener('stalled', handleStalled)

		return audio
	}

	/**
	 * Clean up audio element and remove event listeners
	 *
	 * @param audio - Audio element to clean up
	 */
	function cleanupAudioElement(audio: HTMLAudioElement): void {
		audio.removeEventListener('loadstart', handleLoadStart)
		audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
		audio.removeEventListener('canplay', handleCanPlay)
		audio.removeEventListener('play', handlePlay)
		audio.removeEventListener('pause', handlePause)
		audio.removeEventListener('ended', handleEnded)
		audio.removeEventListener('timeupdate', handleTimeUpdate)
		audio.removeEventListener('error', handleError)
		audio.removeEventListener('abort', handleAbort)
		audio.removeEventListener('stalled', handleStalled)

		audio.pause()
		audio.src = ''
		audio.load()
	}

	// Event handlers
	function handleLoadStart(): void {
		audioState.value.isLoading = true
		audioState.value.error = null
		events.onLoadStart?.()
	}

	function handleLoadedMetadata(): void {
		if (currentAudio.value) {
			audioState.value.duration = currentAudio.value.duration || 0
		}
	}

	function handleCanPlay(): void {
		audioState.value.isLoading = false
		events.onLoadEnd?.()
	}

	function handlePlay(): void {
		audioState.value.isPlaying = true
		events.onPlay?.()
	}

	function handlePause(): void {
		audioState.value.isPlaying = false
		events.onPause?.()
	}

	function handleEnded(): void {
		audioState.value.isPlaying = false
		audioState.value.currentTime = 0
		events.onEnded?.()
	}

	function handleTimeUpdate(): void {
		if (currentAudio.value) {
			audioState.value.currentTime = currentAudio.value.currentTime
		}
	}

	function handleError(): void {
		const errorMessage = currentAudio.value?.error
			? `Audio error: ${currentAudio.value.error.message}`
			: 'Unknown audio error'

		audioState.value.error = errorMessage
		audioState.value.isLoading = false
		audioState.value.isPlaying = false

		events.onError?.(errorMessage)
	}

	function handleAbort(): void {
		audioState.value.isLoading = false
		audioState.value.isPlaying = false
	}

	function handleStalled(): void {
		audioState.value.isLoading = false
		const errorMessage = 'Audio loading stalled - network or server issue'
		audioState.value.error = errorMessage
		events.onError?.(errorMessage)
	}

	/**
	 * Play audio from the specified URL
	 *
	 * Loads and plays an audio file. If a different audio file is currently loaded,
	 * it will be stopped and replaced. Handles loading errors gracefully.
	 *
	 * @param url - URL of the audio file to play
	 * @returns Promise that resolves when playback starts or rejects on error
	 * @throws Error if audio is not supported or URL is invalid
	 */
	async function playAudio(url: string): Promise<void> {
		if (!isAudioSupported.value) {
			throw new Error('Audio playback is not supported in this browser')
		}

		if (!url || typeof url !== 'string') {
			throw new Error('Invalid audio URL provided')
		}

		try {
			// Stop current audio if playing
			if (currentAudio.value) {
				stopAudio()
			}

			// Create new audio element
			const audio = createAudioElement(url)
			currentAudio.value = audio
			currentUrl.value = url

			// Set the source and load
			audio.src = url
			audio.load()

			// Wait for the audio to be ready and then play
			await new Promise<void>((resolve, reject) => {
				const onCanPlay = () => {
					audio.removeEventListener('canplay', onCanPlay)
					audio.removeEventListener('error', onError)
					resolve()
				}

				const onError = () => {
					audio.removeEventListener('canplay', onCanPlay)
					audio.removeEventListener('error', onError)
					reject(new Error('Failed to load audio file'))
				}

				audio.addEventListener('canplay', onCanPlay)
				audio.addEventListener('error', onError)
			})

			// Start playback
			await audio.play()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to play audio'
			audioState.value.error = errorMessage
			audioState.value.isLoading = false
			audioState.value.isPlaying = false
			throw new Error(errorMessage)
		}
	}

	/**
	 * Pause the currently playing audio
	 *
	 * Pauses playback without stopping or unloading the audio.
	 * Can be resumed with resumeAudio().
	 */
	function pauseAudio(): void {
		if (currentAudio.value && !currentAudio.value.paused) {
			currentAudio.value.pause()
		}
	}

	/**
	 * Resume paused audio playback
	 *
	 * Resumes playback from the current position.
	 *
	 * @returns Promise that resolves when playback resumes
	 * @throws Error if no audio is loaded or playback fails
	 */
	async function resumeAudio(): Promise<void> {
		if (!currentAudio.value) {
			throw new Error('No audio loaded to resume')
		}

		if (audioState.value.error) {
			throw new Error(`Cannot resume audio: ${audioState.value.error}`)
		}

		try {
			await currentAudio.value.play()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to resume audio'
			audioState.value.error = errorMessage
			throw new Error(errorMessage)
		}
	}

	/**
	 * Stop audio playback and reset to beginning
	 *
	 * Stops playback, resets the current time to 0, and cleans up the audio element.
	 */
	function stopAudio(): void {
		if (currentAudio.value) {
			cleanupAudioElement(currentAudio.value)
			currentAudio.value = null
		}

		currentUrl.value = null
		audioState.value.isPlaying = false
		audioState.value.isLoading = false
		audioState.value.currentTime = 0
		audioState.value.duration = 0
		audioState.value.error = null
	}

	/**
	 * Set the playback volume
	 *
	 * @param volume - Volume level between 0.0 (muted) and 1.0 (full volume)
	 * @throws Error if volume is out of range
	 */
	function setVolume(volume: number): void {
		if (volume < 0 || volume > 1) {
			throw new Error('Volume must be between 0.0 and 1.0')
		}

		audioState.value.volume = volume

		if (currentAudio.value) {
			currentAudio.value.volume = volume
		}
	}

	/**
	 * Seek to a specific time in the audio
	 *
	 * @param time - Time in seconds to seek to
	 * @throws Error if time is out of range or no audio is loaded
	 */
	function seekTo(time: number): void {
		if (!currentAudio.value) {
			throw new Error('No audio loaded to seek')
		}

		if (time < 0 || time > audioState.value.duration) {
			throw new Error('Seek time is out of range')
		}

		currentAudio.value.currentTime = time
	}

	/**
	 * Toggle between play and pause
	 *
	 * @returns Promise that resolves when the toggle action completes
	 */
	async function togglePlayback(): Promise<void> {
		if (audioState.value.isPlaying) {
			pauseAudio()
		} else if (currentAudio.value) {
			await resumeAudio()
		}
	}

	/**
	 * Check if a specific audio URL is currently loaded
	 *
	 * @param url - URL to check
	 * @returns True if the URL is currently loaded
	 */
	function isCurrentAudio(url: string): boolean {
		return currentUrl.value === url
	}

	/**
	 * Get formatted time string (MM:SS)
	 *
	 * @param seconds - Time in seconds
	 * @returns Formatted time string
	 */
	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = Math.floor(seconds % 60)
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	/**
	 * Get current playback time as formatted string
	 */
	const currentTimeFormatted = computed(() => {
		return formatTime(audioState.value.currentTime)
	})

	/**
	 * Get total duration as formatted string
	 */
	const durationFormatted = computed(() => {
		return formatTime(audioState.value.duration)
	})

	// Cleanup on unmount
	onUnmounted(() => {
		stopAudio()
	})

	return {
		// State
		audioState: readonly(audioState),
		currentUrl: readonly(currentUrl),

		// Computed properties
		canPlay,
		progress,
		isAudioSupported,
		currentTimeFormatted,
		durationFormatted,

		// Methods
		playAudio,
		pauseAudio,
		resumeAudio,
		stopAudio,
		togglePlayback,
		setVolume,
		seekTo,
		isCurrentAudio,
		formatTime,
	}
}
