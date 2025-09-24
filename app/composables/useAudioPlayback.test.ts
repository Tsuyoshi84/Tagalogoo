import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioPlayback } from './useAudioPlayback.ts'

// Mock HTMLAudioElement
class MockAudio {
	src = ''
	volume = 1
	currentTime = 0
	duration = 0
	paused = true
	preload = 'metadata'
	error: MediaError | null = null

	private listeners: Record<string, (() => void)[]> = {}

	addEventListener(event: string, handler: () => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = []
		}
		this.listeners[event].push(handler)
	}

	removeEventListener(event: string, handler: () => void) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event].filter((h) => h !== handler)
		}
	}

	dispatchEvent(event: string) {
		if (this.listeners[event]) {
			for (const handler of this.listeners[event]) {
				handler()
			}
		}
	}

	play() {
		this.paused = false
		this.dispatchEvent('play')
		return Promise.resolve()
	}

	pause() {
		this.paused = true
		this.dispatchEvent('pause')
	}

	load() {
		// Simulate loading
		this.dispatchEvent('loadstart')
		setTimeout(() => {
			this.duration = 120 // 2 minutes
			this.dispatchEvent('loadedmetadata')
			this.dispatchEvent('canplay')
		}, 10)
	}

	// Helper methods for testing
	simulateError(message = 'Network error') {
		this.error = { message } as MediaError
		this.dispatchEvent('error')
	}

	simulateTimeUpdate(time: number) {
		this.currentTime = time
		this.dispatchEvent('timeupdate')
	}

	simulateEnd() {
		this.currentTime = this.duration
		this.paused = true
		this.dispatchEvent('ended')
	}

	simulateStalled() {
		this.dispatchEvent('stalled')
	}
}

// Mock global Audio constructor
const mockAudioInstances: MockAudio[] = []
global.Audio = vi.fn().mockImplementation(() => {
	const instance = new MockAudio()
	mockAudioInstances.push(instance)
	return instance
}) as any

describe('useAudioPlayback', () => {
	let mockOnPlay: ReturnType<typeof vi.fn>
	let mockOnPause: ReturnType<typeof vi.fn>
	let mockOnEnded: ReturnType<typeof vi.fn>
	let mockOnError: ReturnType<typeof vi.fn>
	let mockOnLoadStart: ReturnType<typeof vi.fn>
	let mockOnLoadEnd: ReturnType<typeof vi.fn>

	beforeEach(() => {
		mockOnPlay = vi.fn()
		mockOnPause = vi.fn()
		mockOnEnded = vi.fn()
		mockOnError = vi.fn()
		mockOnLoadStart = vi.fn()
		mockOnLoadEnd = vi.fn()
		mockAudioInstances.length = 0
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('initialization', () => {
		it('should initialize with default state', () => {
			const { audioState, isAudioSupported } = useAudioPlayback()

			expect(audioState.value).toEqual({
				isPlaying: false,
				isLoading: false,
				duration: 0,
				currentTime: 0,
				volume: 1.0,
				error: null,
			})
			expect(isAudioSupported.value).toBe(true)
		})

		it('should register event callbacks', () => {
			const events = {
				onPlay: mockOnPlay,
				onPause: mockOnPause,
				onEnded: mockOnEnded,
				onError: mockOnError,
				onLoadStart: mockOnLoadStart,
				onLoadEnd: mockOnLoadEnd,
			}

			const { playAudio } = useAudioPlayback(events)

			expect(typeof playAudio).toBe('function')
		})
	})

	describe('playAudio', () => {
		it('should play audio successfully', async () => {
			const { playAudio, audioState } = useAudioPlayback({
				onPlay: mockOnPlay,
				onLoadStart: mockOnLoadStart,
				onLoadEnd: mockOnLoadEnd,
			})

			const playPromise = playAudio('https://example.com/audio.mp3')

			// Simulate loading completion
			await new Promise((resolve) => setTimeout(resolve, 20))

			await playPromise

			expect(mockAudioInstances).toHaveLength(1)
			expect(mockAudioInstances[0]?.src).toBe('https://example.com/audio.mp3')
			expect(audioState.value.isPlaying).toBe(true)
			expect(mockOnPlay).toHaveBeenCalled()
			expect(mockOnLoadStart).toHaveBeenCalled()
			expect(mockOnLoadEnd).toHaveBeenCalled()
		})

		it('should handle invalid URL', async () => {
			const { playAudio } = useAudioPlayback()

			await expect(playAudio('')).rejects.toThrow('Invalid audio URL provided')
			await expect(playAudio(null as any)).rejects.toThrow('Invalid audio URL provided')
		})

		it('should handle audio loading errors', async () => {
			const { playAudio, audioState } = useAudioPlayback({
				onError: mockOnError,
			})

			const playPromise = playAudio('https://example.com/invalid.mp3')

			// Simulate error during loading
			setTimeout(() => {
				mockAudioInstances[0]?.simulateError('File not found')
			}, 5)

			await expect(playPromise).rejects.toThrow('Failed to load audio file')
			expect(audioState.value.error).toBeTruthy() // Just check that there is an error
			expect(mockOnError).toHaveBeenCalled()
		})

		it('should stop current audio when playing new audio', async () => {
			const { playAudio, audioState } = useAudioPlayback()

			// Play first audio
			const firstPlay = playAudio('https://example.com/audio1.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))
			await firstPlay

			expect(audioState.value.isPlaying).toBe(true)

			// Play second audio
			const secondPlay = playAudio('https://example.com/audio2.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))
			await secondPlay

			expect(mockAudioInstances[1]?.src).toBe('https://example.com/audio2.mp3')
			expect(audioState.value.isPlaying).toBe(true)
		})
	})

	describe('playback controls', () => {
		it('should pause audio', async () => {
			const { playAudio, pauseAudio, audioState } = useAudioPlayback({
				onPause: mockOnPause,
			})

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			pauseAudio()

			expect(audioState.value.isPlaying).toBe(false)
			expect(mockOnPause).toHaveBeenCalled()
		})

		it('should resume audio', async () => {
			const { playAudio, pauseAudio, resumeAudio, audioState } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			pauseAudio()
			expect(audioState.value.isPlaying).toBe(false)

			await resumeAudio()
			expect(audioState.value.isPlaying).toBe(true)
		})

		it('should handle resume without loaded audio', async () => {
			const { resumeAudio } = useAudioPlayback()

			await expect(resumeAudio()).rejects.toThrow('No audio loaded to resume')
		})

		it('should stop audio', async () => {
			const { playAudio, stopAudio, audioState, currentUrl } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			stopAudio()

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.currentTime).toBe(0)
			expect(audioState.value.duration).toBe(0)
			expect(currentUrl.value).toBeNull()
		})

		it('should toggle playback', async () => {
			const { playAudio, togglePlayback, audioState } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(audioState.value.isPlaying).toBe(true)

			await togglePlayback()
			expect(audioState.value.isPlaying).toBe(false)

			await togglePlayback()
			expect(audioState.value.isPlaying).toBe(true)
		})
	})

	describe('volume control', () => {
		it('should set volume', async () => {
			const { playAudio, setVolume, audioState } = useAudioPlayback()

			setVolume(0.5)
			expect(audioState.value.volume).toBe(0.5)

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(mockAudioInstances[0]?.volume).toBe(0.5)
		})

		it('should validate volume range', () => {
			const { setVolume } = useAudioPlayback()

			expect(() => setVolume(-0.1)).toThrow('Volume must be between 0.0 and 1.0')
			expect(() => setVolume(1.1)).toThrow('Volume must be between 0.0 and 1.0')
		})
	})

	describe('seeking', () => {
		it('should seek to specific time', async () => {
			const { playAudio, seekTo } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			seekTo(30)
			expect(mockAudioInstances[0]?.currentTime).toBe(30)
		})

		it('should validate seek time range', async () => {
			const { playAudio, seekTo } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(() => seekTo(-1)).toThrow('Seek time is out of range')
			expect(() => seekTo(200)).toThrow('Seek time is out of range')
		})

		it('should handle seek without loaded audio', () => {
			const { seekTo } = useAudioPlayback()

			expect(() => seekTo(30)).toThrow('No audio loaded to seek')
		})
	})

	describe('audio events', () => {
		it('should handle time updates', async () => {
			const { playAudio, audioState } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			mockAudioInstances[0]?.simulateTimeUpdate(45)

			expect(audioState.value.currentTime).toBe(45)
		})

		it('should handle audio end', async () => {
			const { playAudio, audioState } = useAudioPlayback({
				onEnded: mockOnEnded,
			})

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			mockAudioInstances[0]?.simulateEnd()

			expect(audioState.value.isPlaying).toBe(false)
			expect(audioState.value.currentTime).toBe(0)
			expect(mockOnEnded).toHaveBeenCalled()
		})

		it('should handle stalled loading', async () => {
			const { playAudio, audioState } = useAudioPlayback({
				onError: mockOnError,
			})

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			mockAudioInstances[0]?.simulateStalled()

			expect(audioState.value.error).toContain('stalled')
			expect(mockOnError).toHaveBeenCalled()
		})
	})

	describe('utility functions', () => {
		it('should check if URL is current audio', async () => {
			const { playAudio, isCurrentAudio } = useAudioPlayback()

			const url = 'https://example.com/audio.mp3'
			await playAudio(url)
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(isCurrentAudio(url)).toBe(true)
			expect(isCurrentAudio('https://example.com/other.mp3')).toBe(false)
		})

		it('should format time correctly', () => {
			const { formatTime } = useAudioPlayback()

			expect(formatTime(0)).toBe('0:00')
			expect(formatTime(65)).toBe('1:05')
			expect(formatTime(3661)).toBe('61:01')
		})

		it('should provide formatted time computed properties', async () => {
			const { playAudio, currentTimeFormatted, durationFormatted } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(durationFormatted.value).toBe('2:00') // 120 seconds

			mockAudioInstances[0]?.simulateTimeUpdate(75)
			expect(currentTimeFormatted.value).toBe('1:15')
		})
	})

	describe('computed properties', () => {
		it('should calculate progress correctly', async () => {
			const { playAudio, progress } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			mockAudioInstances[0]?.simulateTimeUpdate(60) // Half of 120 seconds

			expect(progress.value).toBe(50)
		})

		it('should indicate when audio can play', async () => {
			const { playAudio, canPlay } = useAudioPlayback()

			expect(canPlay.value).toBe(false)

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(canPlay.value).toBe(true)
		})

		it('should handle canPlay with error state', async () => {
			const { playAudio, canPlay } = useAudioPlayback()

			await playAudio('https://example.com/audio.mp3')
			await new Promise((resolve) => setTimeout(resolve, 20))

			expect(canPlay.value).toBe(true)

			// Simulate error by triggering error event
			mockAudioInstances[0]?.simulateError('Test error')
			expect(canPlay.value).toBe(false)
		})
	})
})
