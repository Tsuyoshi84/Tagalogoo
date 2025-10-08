<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import type { CategoryProgress } from '~/types/vocabulary'

interface Props {
	/** Category data to display */
	category: CategoryProgress
	/** Whether the card is in loading state */
	loading?: boolean
}

type Emits = (e: 'click' | 'study', categoryId: string) => void

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function handleCardClick() {
	if (!props.loading) {
		emit('click', props.category.categoryId)
	}
}

function handleStudyClick(event: Event) {
	event.stopPropagation()
	if (!props.loading) {
		emit('study', props.category.categoryId)
	}
}
</script>

<template>
  <div
    class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
    :class="{ 'opacity-50 cursor-not-allowed': loading }"
    @click="handleCardClick"
  >
    <div class="card-body">
      <!-- Loading State -->
      <div v-if="loading" class="animate-pulse">
        <div class="h-6 bg-base-300 rounded mb-2"></div>
        <div class="h-4 bg-base-300 rounded mb-4 w-3/4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-base-300 rounded"></div>
          <div class="h-2 bg-base-300 rounded"></div>
          <div class="flex justify-between">
            <div class="h-4 bg-base-300 rounded w-20"></div>
            <div class="h-4 bg-base-300 rounded w-16"></div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <div class="h-8 bg-base-300 rounded w-20"></div>
        </div>
      </div>

      <!-- Content State -->
      <template v-else>
        <h3 class="card-title text-lg">
          {{ category.categoryName }}
        </h3>

        <!-- Category Description -->
        <p
          v-if="category.categoryDescription"
          class="text-sm text-base-content/70 mt-2"
        >
          {{ category.categoryDescription }}
        </p>

        <!-- Empty State -->
        <div v-if="category.totalWords === 0" class="text-center py-6">
          <BookOpen class="w-12 h-12 mx-auto text-base-content/30 mb-3" />
          <p class="text-sm text-base-content/70">
            No vocabulary words available in this category yet.
          </p>
        </div>

        <!-- Progress Stats -->
        <div v-else class="space-y-3 mt-4">
          <div class="flex justify-between text-sm">
            <span>Progress</span>
            <span>{{ category.wordsLearned }}/{{ category.totalWords }}</span>
          </div>

          <progress
            class="progress progress-primary w-full"
            :value="category.completionPercentage"
            max="100"
          ></progress>

          <div class="flex justify-between items-center">
            <div class="badge badge-sm badge-outline">
              {{ Math.round(category.completionPercentage) }}% Complete
            </div>
            <div
              v-if="category.dueWords > 0"
              class="badge badge-sm badge-warning"
            >
              {{ category.dueWords }} Due
            </div>
            <div v-else class="badge badge-sm badge-success">Up to Date</div>
          </div>
        </div>

        <!-- Study Button -->
        <div class="card-actions justify-end mt-4">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="category.totalWords === 0"
            @click="handleStudyClick"
          >
            <BookOpen class="w-4 h-4" />
            Study
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
