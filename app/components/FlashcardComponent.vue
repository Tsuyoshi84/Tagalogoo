<script setup lang="ts">
import { AlertCircle, Pause, Play } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAudioPlayback } from '~/composables/useAudioPlayback'
import type { Example, FlashcardData } from '~/types/vocabulary'

interface Props {
	flashcard: FlashcardData
	autoFlip?: boolean
}

interface Emits {
	(e: 'flip', isFlipped: boolean): void
	(e: 'audioPlay', audioUrl: string): void
	(e: 'audioError', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
	autoFlip: false,
})

const emit = defineEmits<Emits>()

// Card flip state
const isFlipped = ref(false)

// Audio playback for main word
const { audioState, playAudio, stopAudio } = useAudioPlayback({
	onPlay: () => emit('audioPlay', getMainAudioUrl()),
	onError: (error) => emit('audioError', error),
})

// Computed properties
const hasAudio = computed(() => {
	return props.flashcard.examples?.some((example) => example.audio_url) || false
})

const getMainAudioUrl = (): string => {
	// For now, use the first example's audio URL as the main audio
	const firstExampleWithAudio = props.flashcard.examples?.find((example) => example.audio_url)
	return firstExampleWithAudio?.audio_url || ''
}

// Methods
const handleCardClick = (): void => {
	if (props.autoFlip) return

	isFlipped.value = !isFlipped.value
	emit('flip', isFlipped.value)
}

const handleAudioPlay = async (): Promise<void> => {
	const audioUrl = getMainAudioUrl()
	if (!audioUrl) return

	try {
		await playAudio(audioUrl)
	} catch (error) {
		// Audio error will be handled by the audio instance error handler
	}
}

const handleExampleAudioPlay = async (example: Example): Promise<void> => {
	if (!example.audio_url) return

	try {
		stopAudio()
		await playAudio(example.audio_url)
	} catch (error) {
		// Audio error will be handled by the audio instance error handler
	}
}

// Public methods for parent component control
const flipCard = (flip?: boolean): void => {
	isFlipped.value = flip !== undefined ? flip : !isFlipped.value
	emit('flip', isFlipped.value)
}

const resetCard = (): void => {
	isFlipped.value = false
	stopAudio()
	emit('flip', false)
}

// Expose methods to parent
defineExpose({
	flipCard,
	resetCard,
	isFlipped: computed(() => isFlipped.value),
})
</script>

<template>
	<div class="flashcard-container w-full max-w-md mx-auto">
		<!-- Card wrapper with flip animation -->
		<div
			class="flashcard-wrapper relative w-full h-80 cursor-pointer"
			:class="{ 'flipped': isFlipped }"
			@click="handleCardClick"
		>
			<!-- Front side (Tagalog) -->
			<div class="flashcard-side flashcard-front absolute inset-0 backface-hidden">
				<div class="card bg-base-100 shadow-xl h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
					<div class="card-body flex flex-col justify-center items-center text-center p-6">
						<!-- Language indicator -->
						<div class="badge badge-primary badge-sm mb-4">Tagalog</div>
						
						<!-- Main word/phrase -->
						<h2 class="card-title text-2xl md:text-3xl font-bold text-primary mb-4 break-words">
							{{ flashcard.tl }}
						</h2>
						
						<!-- Audio controls (if audio exists) -->
						<div v-if="hasAudio" class="flex items-center gap-2 mb-4">
							<button
								class="btn btn-circle btn-primary btn-sm"
								:class="{ 'loading': audioState.isLoading }"
								:disabled="audioState.isLoading || !!audioState.error"
								:title="audioState.error || 'Play pronunciation'"
								@click.stop="handleAudioPlay"
							>
								<Play v-if="!audioState.isPlaying && !audioState.isLoading" class="w-4 h-4" />
								<Pause v-else-if="audioState.isPlaying" class="w-4 h-4" />
							</button>
							
							<!-- Audio error indicator -->
							<div v-if="audioState.error" class="tooltip tooltip-error" :data-tip="audioState.error">
								<AlertCircle class="w-4 h-4 text-error" />
							</div>
						</div>
						
						<!-- Tap to reveal hint -->
						<div class="text-sm text-base-content/60 mt-auto">
							<span class="kbd kbd-sm">Tap</span> to reveal translation
						</div>
					</div>
				</div>
			</div>
			
			<!-- Back side (English + Examples) -->
			<div class="flashcard-side flashcard-back absolute inset-0 backface-hidden rotate-y-180">
				<div class="card bg-base-100 shadow-xl h-full border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
					<div class="card-body p-6 overflow-y-auto">
						<!-- Language indicator -->
						<div class="badge badge-secondary badge-sm mb-4">English</div>
						
						<!-- Translation -->
						<h2 class="card-title text-xl md:text-2xl font-bold text-secondary mb-4 break-words">
							{{ flashcard.en }}
						</h2>
						
						<!-- Example sentences -->
						<div v-if="flashcard.examples && flashcard.examples.length > 0" class="space-y-3">
							<h3 class="font-semibold text-base-content/80 text-sm uppercase tracking-wide">
								Examples
							</h3>
							
							<div
								v-for="example in flashcard.examples"
								:key="example.id"
								class="bg-base-200 rounded-lg p-3 space-y-2"
							>
								<!-- Tagalog example -->
								<div class="flex items-start gap-2">
									<span class="badge badge-primary badge-xs mt-1 flex-shrink-0">TL</span>
									<p class="text-sm font-medium">{{ example.tl }}</p>
								</div>
								
								<!-- English translation -->
								<div class="flex items-start gap-2">
									<span class="badge badge-secondary badge-xs mt-1 flex-shrink-0">EN</span>
									<p class="text-sm text-base-content/70">{{ example.en }}</p>
								</div>
								
								<!-- Example audio (if exists) -->
								<div v-if="example.audio_url" class="flex items-center gap-2 pt-1">
									<button
										class="btn btn-circle btn-xs btn-outline"
										@click.stop="handleExampleAudioPlay(example)"
									>
										<Play class="w-3 h-3" />
									</button>
									
									<span class="text-xs text-base-content/50">Example audio</span>
								</div>
							</div>
						</div>
						
						<!-- No examples message -->
						<div v-else class="text-center text-base-content/50 text-sm mt-8">
							No example sentences available
						</div>
						
						<!-- Tap to flip back hint -->
						<div class="text-sm text-base-content/60 mt-auto pt-4 text-center">
							<span class="kbd kbd-sm">Tap</span> to flip back
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<s
tyle scoped>
/* 3D flip animation styles */
.flashcard-wrapper {
	perspective: 1000px;
	transform-style: preserve-3d;
	transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.flashcard-wrapper.flipped {
	transform: rotateY(180deg);
}

.flashcard-side {
	transform-style: preserve-3d;
	transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.backface-hidden {
	backface-visibility: hidden;
}

.rotate-y-180 {
	transform: rotateY(180deg);
}

/* Responsive adjustments */
@media (max-width: 768px) {
	.flashcard-wrapper {
		height: 20rem; /* h-80 equivalent */
	}
}

@media (max-width: 640px) {
	.flashcard-wrapper {
		height: 18rem;
	}
}

/* Smooth hover effects */
.flashcard-side .card {
	transition: all 0.3s ease;
}

/* Loading animation for audio buttons */
.btn.loading::after {
	border-color: currentColor transparent transparent transparent;
}

/* Custom scrollbar for back side content */
.flashcard-back .card-body::-webkit-scrollbar {
	width: 4px;
}

.flashcard-back .card-body::-webkit-scrollbar-track {
	background: transparent;
}

.flashcard-back .card-body::-webkit-scrollbar-thumb {
	background: rgba(0, 0, 0, 0.2);
	border-radius: 2px;
}

.flashcard-back .card-body::-webkit-scrollbar-thumb:hover {
	background: rgba(0, 0, 0, 0.3);
}
</style>