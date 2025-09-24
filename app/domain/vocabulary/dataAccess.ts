import type {
	Category,
	CategoryWithStats,
	Example,
	FlashcardData,
	NewCategory,
	NewExample,
	NewReview,
	NewWord,
	Review,
	Word,
	WordWithDetails,
} from '../database/types.ts'

// Using minimal interface for Supabase client to avoid external dependencies in domain layer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

/**
 * Data access layer for vocabulary operations.
 * Provides CRUD operations and specialized queries for the vocabulary system.
 */

// Category operations

/**
 * Retrieves all vocabulary categories ordered by sort order and name.
 *
 * @param supabase - The Supabase client instance
 * @returns Promise resolving to array of categories
 * @example
 * const categories = await getAllCategories(supabase)
 * console.log(categories) // [{ id: '1', name: 'Greetings', ... }]
 */
export async function getAllCategories(supabase: SupabaseClient): Promise<Category[]> {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order', { ascending: true })
		.order('name', { ascending: true })

	if (error) {
		throw new Error(`Failed to fetch categories: ${error.message}`)
	}

	return data || []
}

/**
 * Retrieves a category with additional statistics (word count and due count).
 *
 * @param supabase - The Supabase client instance
 * @param categoryId - The ID of the category to retrieve
 * @param userId - Optional user ID to calculate due cards count
 * @returns Promise resolving to category with stats or undefined if not found
 * @example
 * const categoryStats = await getCategoryWithStats(supabase, 'cat-1', 'user-1')
 * console.log(categoryStats?.wordCount) // 25
 * console.log(categoryStats?.dueCount) // 5
 */
export async function getCategoryWithStats(
	supabase: SupabaseClient,
	categoryId: string,
	userId?: string,
): Promise<CategoryWithStats | undefined> {
	// Get the category
	const { data: category, error: categoryError } = await supabase
		.from('categories')
		.select('*')
		.eq('id', categoryId)
		.single()

	if (categoryError) {
		if (categoryError.code === 'PGRST116') {
			return undefined // Not found
		}
		throw new Error(`Failed to fetch category: ${categoryError.message}`)
	}

	// Get word count for this category
	const { count: wordCount, error: wordCountError } = await supabase
		.from('words')
		.select('*', { count: 'exact', head: true })
		.eq('category_id', categoryId)

	if (wordCountError) {
		throw new Error(`Failed to count words: ${wordCountError.message}`)
	}

	// Get due count if userId is provided
	let dueCount = 0
	if (userId) {
		// Use RPC function for complex due cards query
		const { data: dueCountData, error: dueCountError } = await supabase.rpc('get_due_cards_count', {
			user_id: userId,
			category_id: categoryId,
		})

		if (dueCountError) {
			throw new Error(`Failed to count due cards: ${dueCountError.message}`)
		}

		dueCount = dueCountData || 0
	}

	return {
		...category,
		wordCount: wordCount || 0,
		dueCount,
	}
}

/**
 * Creates a new vocabulary category.
 *
 * @param supabase - The Supabase client instance
 * @param categoryData - The category data to create
 * @returns Promise resolving to the created category
 * @throws Error if category creation fails
 * @example
 * const newCategory = await createCategory(supabase, {
 *   name: 'Food',
 *   description: 'Food vocabulary',
 *   sort_order: 2
 * })
 */
export async function createCategory(
	supabase: SupabaseClient,
	categoryData: NewCategory,
): Promise<Category> {
	const { data, error } = await supabase.from('categories').insert(categoryData).select().single()

	if (error) {
		throw new Error(`Failed to create category: ${error.message}`)
	}

	if (!data) {
		throw new Error('Failed to create category: No data returned')
	}

	return data
}

// Word operations

/**
 * Retrieves all words belonging to a specific category.
 *
 * @param supabase - The Supabase client instance
 * @param categoryId - The ID of the category
 * @returns Promise resolving to array of words in the category
 * @example
 * const words = await getWordsByCategory(supabase, 'greetings-cat')
 * console.log(words.length) // 10
 */
export async function getWordsByCategory(
	supabase: SupabaseClient,
	categoryId: string,
): Promise<Word[]> {
	const { data, error } = await supabase.from('words').select('*').eq('category_id', categoryId)

	if (error) {
		throw new Error(`Failed to fetch words: ${error.message}`)
	}

	return data || []
}

/**
 * Retrieves a word with its category, examples, and optional review data.
 *
 * @param supabase - The Supabase client instance
 * @param wordId - The ID of the word to retrieve
 * @param userId - Optional user ID to include review data
 * @returns Promise resolving to word with details or undefined if not found
 * @example
 * const wordDetails = await getWordWithDetails(supabase, 'word-1', 'user-1')
 * console.log(wordDetails?.category.name) // 'Greetings'
 * console.log(wordDetails?.examples.length) // 3
 * console.log(wordDetails?.review?.ease) // 2.5
 */
export async function getWordWithDetails(
	supabase: SupabaseClient,
	wordId: string,
	userId?: string,
): Promise<WordWithDetails | undefined> {
	// Get word with category
	const { data: wordData, error: wordError } = await supabase
		.from('words')
		.select(`
			*,
			category:categories(*)
		`)
		.eq('id', wordId)
		.single()

	if (wordError) {
		if (wordError.code === 'PGRST116') {
			return undefined // Not found
		}
		throw new Error(`Failed to fetch word: ${wordError.message}`)
	}

	// Get examples for this word
	const { data: examples, error: examplesError } = await supabase
		.from('examples')
		.select('*')
		.eq('word_id', wordId)

	if (examplesError) {
		throw new Error(`Failed to fetch examples: ${examplesError.message}`)
	}

	// Get review data if userId is provided
	let review: Review | undefined
	if (userId) {
		const { data: reviewData, error: reviewError } = await supabase
			.from('reviews')
			.select('*')
			.eq('word_id', wordId)
			.eq('user_id', userId)
			.single()

		if (reviewError && reviewError.code !== 'PGRST116') {
			throw new Error(`Failed to fetch review: ${reviewError.message}`)
		}

		review = reviewData || undefined
	}

	return {
		...wordData,
		category: wordData.category,
		examples: examples || [],
		review,
	}
}

/**
 * Creates a new vocabulary word.
 *
 * @param supabase - The Supabase client instance
 * @param wordData - The word data to create
 * @returns Promise resolving to the created word
 * @throws Error if word creation fails
 * @example
 * const newWord = await createWord(supabase, {
 *   category_id: 'greetings-cat',
 *   tl: 'Kumusta',
 *   en: 'Hello'
 * })
 */
export async function createWord(supabase: SupabaseClient, wordData: NewWord): Promise<Word> {
	const { data, error } = await supabase.from('words').insert(wordData).select().single()

	if (error) {
		throw new Error(`Failed to create word: ${error.message}`)
	}

	if (!data) {
		throw new Error('Failed to create word: No data returned')
	}

	return data
}

// Example operations

/**
 * Retrieves all examples for a specific word.
 *
 * @param supabase - The Supabase client instance
 * @param wordId - The ID of the word
 * @returns Promise resolving to array of examples for the word
 * @example
 * const examples = await getExamplesByWord(supabase, 'word-1')
 * console.log(examples[0].tl) // 'Kumusta ka?'
 * console.log(examples[0].en) // 'How are you?'
 */
export async function getExamplesByWord(
	supabase: SupabaseClient,
	wordId: string,
): Promise<Example[]> {
	const { data, error } = await supabase.from('examples').select('*').eq('word_id', wordId)

	if (error) {
		throw new Error(`Failed to fetch examples: ${error.message}`)
	}

	return data || []
}

/**
 * Creates a new example sentence for a word.
 *
 * @param supabase - The Supabase client instance
 * @param exampleData - The example data to create
 * @returns Promise resolving to the created example
 * @throws Error if example creation fails
 * @example
 * const newExample = await createExample(supabase, {
 *   word_id: 'word-1',
 *   tl: 'Kumusta ka?',
 *   en: 'How are you?',
 *   audio_url: 'audio/kumusta.mp3'
 * })
 */
export async function createExample(
	supabase: SupabaseClient,
	exampleData: NewExample,
): Promise<Example> {
	const { data, error } = await supabase.from('examples').insert(exampleData).select().single()

	if (error) {
		throw new Error(`Failed to create example: ${error.message}`)
	}

	if (!data) {
		throw new Error('Failed to create example: No data returned')
	}

	return data
}

// Review operations

/**
 * Retrieves a user's review data for a specific word.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param wordId - The ID of the word
 * @returns Promise resolving to review data or undefined if not found
 * @example
 * const review = await getUserReview(supabase, 'user-1', 'word-1')
 * console.log(review?.ease) // 2.5
 * console.log(review?.interval_days) // 3
 */
export async function getUserReview(
	supabase: SupabaseClient,
	userId: string,
	wordId: string,
): Promise<Review | undefined> {
	const { data, error } = await supabase
		.from('reviews')
		.select('*')
		.eq('user_id', userId)
		.eq('word_id', wordId)
		.single()

	if (error) {
		if (error.code === 'PGRST116') {
			return undefined // Not found
		}
		throw new Error(`Failed to fetch review: ${error.message}`)
	}

	return data || undefined
}

/**
 * Creates a new review or updates an existing one for a user-word combination.
 *
 * @param supabase - The Supabase client instance
 * @param reviewData - The review data to create or update
 * @returns Promise resolving to the created or updated review
 * @throws Error if review creation/update fails
 * @example
 * const review = await createOrUpdateReview(supabase, {
 *   user_id: 'user-1',
 *   word_id: 'word-1',
 *   ease: 2.6,
 *   interval_days: 4,
 *   reps: 2,
 *   lapses: 0,
 *   next_due: '2024-01-05',
 *   last_reviewed: '2024-01-01'
 * })
 */
export async function createOrUpdateReview(
	supabase: SupabaseClient,
	reviewData: NewReview,
): Promise<Review> {
	const { data, error } = await supabase
		.from('reviews')
		.upsert(reviewData, {
			onConflict: 'user_id,word_id',
		})
		.select()
		.single()

	if (error) {
		throw new Error(`Failed to create or update review: ${error.message}`)
	}

	if (!data) {
		throw new Error('Failed to create or update review: No data returned')
	}

	return data
}

// Specialized queries for flashcard system

/**
 * Retrieves flashcards that are due for review, with complete word, category, and example data.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param categoryId - Optional category ID to filter by
 * @param limit - Optional limit on number of cards to return
 * @returns Promise resolving to array of flashcard data
 * @example
 * const dueCards = await getDueCards(supabase, 'user-1', 'greetings-cat', 10)
 * console.log(dueCards[0].tl) // 'Kumusta'
 * console.log(dueCards[0].category.name) // 'Greetings'
 * console.log(dueCards[0].examples.length) // 2
 */
export async function getDueCards(
	supabase: SupabaseClient,
	userId: string,
	categoryId?: string,
	limit?: number,
): Promise<FlashcardData[]> {
	// Use RPC function for complex due cards query with joins
	const { data, error } = await supabase.rpc('get_due_cards', {
		user_id: userId,
		category_id: categoryId,
		card_limit: limit,
	})

	if (error) {
		throw new Error(`Failed to fetch due cards: ${error.message}`)
	}

	if (!data) {
		return []
	}

	// Get examples for each word
	const flashcards: FlashcardData[] = []
	for (const card of data) {
		const { data: examples, error: examplesError } = await supabase
			.from('examples')
			.select('*')
			.eq('word_id', card.id)

		if (examplesError) {
			throw new Error(`Failed to fetch examples: ${examplesError.message}`)
		}

		flashcards.push({
			...card,
			examples: examples || [],
		})
	}

	return flashcards
}

/**
 * Counts the number of cards due for review for a user.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param categoryId - Optional category ID to filter by
 * @returns Promise resolving to count of due cards
 * @example
 * const dueCount = await getDueCardCount(supabase, 'user-1')
 * console.log(dueCount) // 15
 */
export async function getDueCardCount(
	supabase: SupabaseClient,
	userId: string,
	categoryId?: string,
): Promise<number> {
	const { data, error } = await supabase.rpc('get_due_cards_count', {
		user_id: userId,
		category_id: categoryId,
	})

	if (error) {
		throw new Error(`Failed to count due cards: ${error.message}`)
	}

	return data || 0
}

/**
 * Retrieves recent review history for a user with word and category details.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param limit - Maximum number of reviews to return (default: 10)
 * @returns Promise resolving to array of recent reviews with word and category data
 * @example
 * const recentReviews = await getRecentReviews(supabase, 'user-1', 5)
 * console.log(recentReviews[0].word.tl) // 'Kumusta'
 * console.log(recentReviews[0].category.name) // 'Greetings'
 * console.log(recentReviews[0].ease) // 2.5
 */
export async function getRecentReviews(
	supabase: SupabaseClient,
	userId: string,
	limit = 10,
): Promise<Array<Review & { word: Word; category: Category }>> {
	const { data, error } = await supabase
		.from('reviews')
		.select(`
			*,
			word:words(*),
			category:words(categories(*))
		`)
		.eq('user_id', userId)
		.order('last_reviewed', { ascending: false })
		.limit(limit)

	if (error) {
		throw new Error(`Failed to fetch recent reviews: ${error.message}`)
	}

	if (!data) {
		return []
	}

	// Type the response data
	type RecentReviewResult = Review & {
		word: Word
		category: Category
	}

	const typedData = data as RecentReviewResult[]

	return typedData.map((review) => ({
		...review,
		word: review.word,
		category: review.category,
	}))
}

// Progress sync functions

/**
 * Saves user progress data for a word, filling in default values for missing fields.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param wordId - The ID of the word
 * @param reviewData - Partial review data to save
 * @returns Promise resolving to the saved review data
 * @example
 * const progress = await saveUserProgress(supabase, 'user-1', 'word-1', {
 *   ease: 2.6,
 *   interval_days: 4,
 *   reps: 2
 * })
 */
export async function saveUserProgress(
	supabase: SupabaseClient,
	userId: string,
	wordId: string,
	reviewData: Partial<NewReview>,
): Promise<Review> {
	const fullReviewData: NewReview = {
		userId,
		wordId,
		ease: reviewData.ease ?? 2.5,
		intervalDays: reviewData.intervalDays ?? 0,
		reps: reviewData.reps ?? 0,
		lapses: reviewData.lapses ?? 0,
		nextDue: reviewData.nextDue ?? new Date().toISOString().split('T')[0],
		lastReviewed: reviewData.lastReviewed ?? new Date().toISOString().split('T')[0],
	}

	return await createOrUpdateReview(supabase, fullReviewData)
}

/**
 * Loads all progress data for a user.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @returns Promise resolving to array of all user's review data
 * @example
 * const allProgress = await loadUserProgress(supabase, 'user-1')
 * console.log(allProgress.length) // 50
 */
export async function loadUserProgress(
	supabase: SupabaseClient,
	userId: string,
): Promise<Review[]> {
	const { data, error } = await supabase.from('reviews').select('*').eq('user_id', userId)

	if (error) {
		throw new Error(`Failed to load user progress: ${error.message}`)
	}

	return data || []
}

/**
 * Retrieves comprehensive progress statistics for a user.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @returns Promise resolving to user progress statistics
 * @example
 * const stats = await getUserProgressStats(supabase, 'user-1')
 * console.log(stats.totalCards) // 100
 * console.log(stats.studiedCards) // 75
 * console.log(stats.dueCards) // 15
 * console.log(stats.averageEase) // 2.7
 */
export async function getUserProgressStats(
	supabase: SupabaseClient,
	userId: string,
): Promise<{
	totalCards: number
	studiedCards: number
	dueCards: number
	averageEase: number
}> {
	// Use RPC function for complex statistics query
	const { data, error } = await supabase.rpc('get_user_progress_stats', {
		user_id: userId,
	})

	if (error) {
		throw new Error(`Failed to fetch progress statistics: ${error.message}`)
	}

	return {
		totalCards: data?.total_cards ?? 0,
		studiedCards: data?.studied_cards ?? 0,
		dueCards: data?.due_cards ?? 0,
		averageEase: data?.average_ease ?? 2.5,
	}
}
