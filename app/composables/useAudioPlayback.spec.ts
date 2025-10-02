import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioPlayback } from './useAudioPlayback'

class MockMediaError extends Error {
	static readonly MEDIA_ERR_ABORTED = 1
	static readonly MEDIA_ERR_NETWORK = 2
	static readonly MEDIA_ERR_DECODE = 3
	static readonly MEDIA_ERR_SRC_NOT_SUPPORTED = 4

	readonly MEDIA_ERR_ABORTED = MockMediaError.MEDIA_ERR_ABORTED
	readonly MEDIA_ERR_NETWORK = MockMediaError.MEDIA_ERR_NETWORK
	readonly MEDIA_ERR_DECODE = MockMediaError.MEDIA_ERR_DECODE
	readonly MEDIA_ERR_SRC_NOT_SUPPORTED = MockMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
	readonly code: number

	constructor(code: number) {
		super('MockMediaError')
		this.code = code
	}
}

globalThis.MediaError = MockMediaError as unknown as typeof MediaError

// Mock HTMLAudioElement
class MockAudioElement {
	src = ''
	volume = 1
	currentTime = 0
	duration = 0
	paused = true
	preload = 'none'
	error: MediaError | null = null

	private listeners: { [key: string]: EventListener[] } = {}

	addEventListener(event: string, listener: EventListener) {
		if (!this.listeners[event]) {
			this.listeners[event] = []
		}
		this.listeners[event].push(listener)
	}

	removeEventListener(event: string, listener: EventListener) {
		if (this.listeners[event]) {
			const index = this.listeners[event].indexOf(listener)
			if (index > -1) {
				this.listeners[event].splice(index, 1)
			}
		}
	}

	dispatchEvent(event: Event) {
		const eventType = event.type
		if (this.listeners[eventType]) {
			for (const listener of this.listeners[eventType]) {
				listener.call(this, event)
			}
		}
		return true
	}

	play() {
		if (this.src === 'invalid-url') {
			throw new Error('Failed to play audio')
		}
		this.paused = false
		this.dispatchEvent(new Event('play'))
		return Promise.resolve()
	}

	pause() {
		this.paused = true
		this.dispatchEvent(new Event('pause'))
	}

	// Helper methods for testing
	simulateLoadStart() {
		this.dispatchEvent(new Event('loadstart'))
	}

	simulateCanPlayThrough() {
		this.duration = 30 // 30 seconds
		this.dispatchEvent(new Event('durationchange'))
		this.dispatchEvent(new Event('canplaythrough'))
	}

	simulateTimeUpdate(time: number) {
		this.currentTime = time
		this.dispatchEvent(new Event('timeupdate'))
	}

	simulateEnded() {
		this.currentTime = this.duration
		this.paused = true
		this.dispatchEvent(new Event('ended'))
	}

	simulateError(code: number = MediaError.MEDIA_ERR_NETWORK) {
		this.error = new MockMediaError(code) as MediaError
		this.dispatchEvent(new Event('error'))
	}
}

// Mock the global Audio constructor
global.Audio = vi.fn(() => new MockAudioElement()) as any

describe('useAudioPlayback', () => {
	let mockEvents: {
		onPlay: ReturnType<typeof vi.fn>
		onPause: ReturnType<typeof vi.fn>
		onEnded: ReturnType<typeof vi.fn>
		onError: ReturnType<typeof vi.fn>
		onLoadStart: ReturnType<typeof vi.fn>
		onLoadEnd: ReturnType<typeof vi.fn>
		onTimeUpdate: ReturnType<typeof vi.fn>
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockEvents = {
			onPlay: vi.fn(),
			onPause: vi.fn(),
			onEnded: vi.fn(),
			onError: vi.fn(),
			onLoadStart: vi.fn(),
			onLoadEnd: vi.fn(),
			onTimeUpdate: vi.fn(),
		}
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('initialization', () => {
		it('should initialize with default state', () => {
			const { audioState } = useAudioPlayback()

			expect(audioState.value).toEqual({
				isPlaying: false,
				isLoading: false,
				duration: 0,
				currentTime: 0,
				volume: 1.0,
				error: null,
			})
		})

		it('should accept event callbacks', () => {
			const { audioState } = useAudioPlayback(mockEvents)
			expect(audioState.value).toBeDefined()
		})
	})

	describe('playAudio', () => {
		it('should play audio successfully', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			const playPromise = playAudio('test-audio.mp3')

			// Simulate audio loading and playing
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateLoadStart()
			audioElement.simulateCanPlayThrough()

			await playPromise

			expect(audioState.value.isPlaying).toBe(true)
			expect(audioState.value.error).toBeNull()
			expect(mockEvents.onPlay).toHaveBeenCalled()
		})

		it('should handle audio play errors', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			await expect(playAudio('invalid-url')).rejects.toThrow('Failed to play audio')

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.error).toBe('Failed to play audio')
		})

		it('should initialize new audio when URL changes', async () => {
			const { playAudio } = useAudioPlayback()

			await playAudio('audio1.mp3')
			const firstAudio = (global.Audio as any).mock.results[0].value

			await playAudio('audio2.mp3')
			const secondAudio = (global.Audio as any).mock.results[1].value

			expect(firstAudio).not.toBe(secondAudio)
		})
	})

	describe('pauseAudio', () => {
		it('should pause playing audio', async () => {
			const { playAudio, pauseAudio, audioState } = useAudioPlayback(mockEvents)

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			pauseAudio()

			expect(audioState.value.isPlaying).toBe(false)
			expect(mockEvents.onPause).toHaveBeenCalled()
		})

		it('should handle pause when no audio is playing', () => {
			const { pauseAudio } = useAudioPlayback()

			// Should not throw error
			expect(() => pauseAudio()).not.toThrow()
		})
	})

	describe('stopAudio', () => {
		it('should stop audio and reset position', async () => {
			const { playAudio, stopAudio, audioState } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()
			audioElement.simulateTimeUpdate(15) // 15 seconds

			stopAudio()

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.currentTime).toBe(0)
		})
	})

	describe('togglePlayback', () => {
		it('should toggle between play and pause', async () => {
			const { togglePlayback, audioState } = useAudioPlayback()

			// Start playing
			await togglePlayback('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			expect(audioState.value.isPlaying).toBe(true)

			// Toggle to pause
			await togglePlayback()
			expect(audioState.value.isPlaying).toBe(false)
		})
	})

	describe('volume control', () => {
		it('should set volume correctly', async () => {
			const { playAudio, setVolume, audioState } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement

			setVolume(0.5)

			expect(audioState.value.volume).toBe(0.5)
			expect(audioElement.volume).toBe(0.5)
		})

		it('should clamp volume to valid range', () => {
			const { setVolume, audioState } = useAudioPlayback()

			setVolume(-0.5) // Below minimum
			expect(audioState.value.volume).toBe(0)

			setVolume(1.5) // Above maximum
			expect(audioState.value.volume).toBe(1)
		})
	})

	describe('seeking', () => {
		it('should seek to specific time', async () => {
			const { playAudio, seekTo } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			seekTo(15)

			expect(audioElement.currentTime).toBe(15)
		})

		it('should clamp seek time to valid range', async () => {
			const { playAudio, seekTo } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough() // Sets duration to 30

			seekTo(-5) // Below minimum
			expect(audioElement.currentTime).toBe(0)

			seekTo(50) // Above maximum
			expect(audioElement.currentTime).toBe(30)
		})
	})

	describe('event handling', () => {
		it('should handle load events', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			const playPromise = playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement

			audioElement.simulateLoadStart()
			expect(audioState.value.isLoading).toBe(true)
			expect(mockEvents.onLoadStart).toHaveBeenCalled()

			audioElement.simulateCanPlayThrough()
			expect(audioState.value.isLoading).toBe(false)
			expect(audioState.value.duration).toBe(30)
			expect(mockEvents.onLoadEnd).toHaveBeenCalled()

			await playPromise
		})

		it('should handle time updates', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			audioElement.simulateTimeUpdate(10)

			expect(audioState.value.currentTime).toBe(10)
			expect(mockEvents.onTimeUpdate).toHaveBeenCalledWith(10, 30)
		})

		it('should handle audio end', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			audioElement.simulateEnded()

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.currentTime).toBe(0)
			expect(mockEvents.onEnded).toHaveBeenCalled()
		})

		it('should handle audio errors', async () => {
			const { playAudio, audioState } = useAudioPlayback(mockEvents)

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement

			audioElement.simulateError(MediaError.MEDIA_ERR_NETWORK)

			expect(audioState.value.error).toBe('Network error occurred while loading audio')
			expect(audioState.value.isPlaying).toBe(false)
			expect(mockEvents.onError).toHaveBeenCalledWith('Network error occurred while loading audio')
		})
	})

	describe('utility functions', () => {
		it('should format time correctly', () => {
			const { formatTime } = useAudioPlayback()

			expect(formatTime(0)).toBe('0:00')
			expect(formatTime(65)).toBe('1:05')
			expect(formatTime(3661)).toBe('61:01')
			expect(formatTime(-5)).toBe('0:00')
			expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00')
		})

		it('should calculate progress correctly', async () => {
			const { playAudio, getProgress } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement
			audioElement.simulateCanPlayThrough() // duration = 30

			audioElement.simulateTimeUpdate(15) // currentTime = 15

			expect(getProgress()).toBe(50) // 15/30 * 100 = 50%
		})

		it('should handle progress calculation with no duration', () => {
			const { getProgress } = useAudioPlayback()
			expect(getProgress()).toBe(0)
		})

		it('should validate audio URLs', async () => {
			const { validateAudioUrl } = useAudioPlayback()

			const validationPromise = validateAudioUrl('valid-audio.mp3')
			const audioElement = (global.Audio as any).mock.results.at(-1)?.value as MockAudioElement
			audioElement.simulateCanPlayThrough()

			const result = await validationPromise
			expect(result).toBe(true)
		})

		it('should preload audio', () => {
			const { preloadAudio } = useAudioPlayback()

			preloadAudio('test-audio.mp3')
			const audioElement = (global.Audio as any).mock.results[0].value as MockAudioElement

			expect(audioElement.src).toBe('test-audio.mp3')
			expect(audioElement.preload).toBe('auto')
		})
	})

	describe('cleanup', () => {
		it('should cleanup audio resources', async () => {
			const { playAudio, cleanupAudio, audioState, currentAudioUrl } = useAudioPlayback()

			await playAudio('test-audio.mp3')
			cleanupAudio()

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.isLoading).toBe(false)
			expect(audioState.value.currentTime).toBe(0)
			expect(audioState.value.duration).toBe(0)
			expect(audioState.value.error).toBeNull()
			expect(currentAudioUrl.value).toBeNull()
		})
	})
})
