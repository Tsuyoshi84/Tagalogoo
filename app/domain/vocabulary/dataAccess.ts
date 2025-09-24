import { and, desc, eq, lte, sql } from 'drizzle-orm'
import type { db } from '../database/client.ts'
import { categories, examples, reviews, words } from '../database/schema.ts'
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

/**
 * Data access layer for vocabulary operations.
 * Provides CRUD operations and specialized queries for the vocabulary system.
 */

// Category operations

/**
 * Retrieves all vocabulary categories ordered by sort order and name.
 *
 * @param database - The database instance
 * @returns Promise resolving to array of categories
 * @example
 * const categories = await getAllCategories(db)
 * console.log(categories) // [{ id: '1', name: 'Greetings', ... }]
 */
export async function getAllCategories(database: typeof db): Promise<Category[]> {
	return await database.select().from(categories).orderBy(categories.sortOrder, categories.name)
}

/**
 * Retrieves a category with additional statistics (word count and due count).
 *
 * @param database - The database instance
 * @param categoryId - The ID of the category to retrieve
 * @param userId - Optional user ID to calculate due cards count
 * @returns Promise resolving to category with stats or undefined if not found
 * @example
 * const categoryStats = await getCategoryWithStats(db, 'cat-1', 'user-1')
 * console.log(categoryStats?.wordCount) // 25
 * console.log(categoryStats?.dueCount) // 5
 */
export async function getCategoryWithStats(
	database: typeof db,
	categoryId: string,
	userId?: string,
): Promise<CategoryWithStats | undefined> {
	const category = await database
		.select()
		.from(categories)
		.where(eq(categories.id, categoryId))
		.limit(1)

	if (category.length === 0) {
		return undefined
	}

	// Get word count for this category
	const wordCountResult = await database
		.select({ count: sql<number>`count(*)` })
		.from(words)
		.where(eq(words.categoryId, categoryId))

	const wordCount = wordCountResult[0]?.count ?? 0

	// Get due count if userId is provided
	let dueCount = 0
	if (userId) {
		const dueCountResult = await database
			.select({ count: sql<number>`count(*)` })
			.from(words)
			.leftJoin(reviews, and(eq(reviews.wordId, words.id), eq(reviews.userId, userId)))
			.where(
				and(
					eq(words.categoryId, categoryId),
					// Card is due if: no review exists OR next_due <= today
					sql`(${reviews.nextDue} IS NULL OR ${reviews.nextDue} <= CURRENT_DATE)`,
				),
			)

		dueCount = dueCountResult[0]?.count ?? 0
	}

	const foundCategory = category[0]
	if (!foundCategory) {
		return undefined
	}

	return {
		...foundCategory,
		wordCount,
		dueCount,
	}
}

/**
 * Creates a new vocabulary category.
 *
 * @param database - The database instance
 * @param categoryData - The category data to create
 * @returns Promise resolving to the created category
 * @throws Error if category creation fails
 * @example
 * const newCategory = await createCategory(db, {
 *   name: 'Food',
 *   description: 'Food vocabulary',
 *   sortOrder: 2
 * })
 */
export async function createCategory(
	database: typeof db,
	categoryData: NewCategory,
): Promise<Category> {
	const result = await database.insert(categories).values(categoryData).returning()
	const created = result[0]
	if (!created) {
		throw new Error('Failed to create category')
	}
	return created
}

// Word operations

/**
 * Retrieves all words belonging to a specific category.
 *
 * @param database - The database instance
 * @param categoryId - The ID of the category
 * @returns Promise resolving to array of words in the category
 * @example
 * const words = await getWordsByCategory(db, 'greetings-cat')
 * console.log(words.length) // 10
 */
export async function getWordsByCategory(database: typeof db, categoryId: string): Promise<Word[]> {
	return await database.select().from(words).where(eq(words.categoryId, categoryId))
}

/**
 * Retrieves a word with its category, examples, and optional review data.
 *
 * @param database - The database instance
 * @param wordId - The ID of the word to retrieve
 * @param userId - Optional user ID to include review data
 * @returns Promise resolving to word with details or undefined if not found
 * @example
 * const wordDetails = await getWordWithDetails(db, 'word-1', 'user-1')
 * console.log(wordDetails?.category.name) // 'Greetings'
 * console.log(wordDetails?.examples.length) // 3
 * console.log(wordDetails?.review?.ease) // 2.5
 */
export async function getWordWithDetails(
	database: typeof db,
	wordId: string,
	userId?: string,
): Promise<WordWithDetails | undefined> {
	const wordResult = await database
		.select({
			word: words,
			category: categories,
		})
		.from(words)
		.innerJoin(categories, eq(words.categoryId, categories.id))
		.where(eq(words.id, wordId))
		.limit(1)

	if (wordResult.length === 0) {
		return undefined
	}

	const foundResult = wordResult[0]
	if (!foundResult) {
		return undefined
	}

	const { word, category } = foundResult

	// Get examples for this word
	const wordExamples = await database.select().from(examples).where(eq(examples.wordId, wordId))

	// Get review data if userId is provided
	let review: Review | undefined
	if (userId) {
		const reviewResult = await database
			.select()
			.from(reviews)
			.where(and(eq(reviews.wordId, wordId), eq(reviews.userId, userId)))
			.limit(1)

		review = reviewResult[0]
	}

	return {
		...word,
		category,
		examples: wordExamples,
		review,
	}
}

/**
 * Creates a new vocabulary word.
 *
 * @param database - The database instance
 * @param wordData - The word data to create
 * @returns Promise resolving to the created word
 * @throws Error if word creation fails
 * @example
 * const newWord = await createWord(db, {
 *   categoryId: 'greetings-cat',
 *   tl: 'Kumusta',
 *   en: 'Hello'
 * })
 */
export async function createWord(database: typeof db, wordData: NewWord): Promise<Word> {
	const result = await database.insert(words).values(wordData).returning()
	const created = result[0]
	if (!created) {
		throw new Error('Failed to create word')
	}
	return created
}

// Example operations

/**
 * Retrieves all examples for a specific word.
 *
 * @param database - The database instance
 * @param wordId - The ID of the word
 * @returns Promise resolving to array of examples for the word
 * @example
 * const examples = await getExamplesByWord(db, 'word-1')
 * console.log(examples[0].tl) // 'Kumusta ka?'
 * console.log(examples[0].en) // 'How are you?'
 */
export async function getExamplesByWord(database: typeof db, wordId: string): Promise<Example[]> {
	return await database.select().from(examples).where(eq(examples.wordId, wordId))
}

/**
 * Creates a new example sentence for a word.
 *
 * @param database - The database instance
 * @param exampleData - The example data to create
 * @returns Promise resolving to the created example
 * @throws Error if example creation fails
 * @example
 * const newExample = await createExample(db, {
 *   wordId: 'word-1',
 *   tl: 'Kumusta ka?',
 *   en: 'How are you?',
 *   audioUrl: 'audio/kumusta.mp3'
 * })
 */
export async function createExample(
	database: typeof db,
	exampleData: NewExample,
): Promise<Example> {
	const result = await database.insert(examples).values(exampleData).returning()
	const created = result[0]
	if (!created) {
		throw new Error('Failed to create example')
	}
	return created
}

// Review operations

/**
 * Retrieves a user's review data for a specific word.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @param wordId - The ID of the word
 * @returns Promise resolving to review data or undefined if not found
 * @example
 * const review = await getUserReview(db, 'user-1', 'word-1')
 * console.log(review?.ease) // 2.5
 * console.log(review?.intervalDays) // 3
 */
export async function getUserReview(
	database: typeof db,
	userId: string,
	wordId: string,
): Promise<Review | undefined> {
	const result = await database
		.select()
		.from(reviews)
		.where(and(eq(reviews.userId, userId), eq(reviews.wordId, wordId)))
		.limit(1)

	return result[0] ?? undefined
}

/**
 * Creates a new review or updates an existing one for a user-word combination.
 *
 * @param database - The database instance
 * @param reviewData - The review data to create or update
 * @returns Promise resolving to the created or updated review
 * @throws Error if review creation/update fails
 * @example
 * const review = await createOrUpdateReview(db, {
 *   userId: 'user-1',
 *   wordId: 'word-1',
 *   ease: 2.6,
 *   intervalDays: 4,
 *   reps: 2,
 *   lapses: 0,
 *   nextDue: '2024-01-05',
 *   lastReviewed: '2024-01-01'
 * })
 */
export async function createOrUpdateReview(
	database: typeof db,
	reviewData: NewReview,
): Promise<Review> {
	const result = await database
		.insert(reviews)
		.values(reviewData)
		.onConflictDoUpdate({
			target: [reviews.userId, reviews.wordId],
			set: {
				ease: reviewData.ease,
				intervalDays: reviewData.intervalDays,
				reps: reviewData.reps,
				lapses: reviewData.lapses,
				nextDue: reviewData.nextDue,
				lastReviewed: reviewData.lastReviewed,
			},
		})
		.returning()

	const created = result[0]
	if (!created) {
		throw new Error('Failed to create or update review')
	}
	return created
}

// Specialized queries for flashcard system

/**
 * Retrieves flashcards that are due for review, with complete word, category, and example data.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @param categoryId - Optional category ID to filter by
 * @param limit - Optional limit on number of cards to return
 * @returns Promise resolving to array of flashcard data
 * @example
 * const dueCards = await getDueCards(db, 'user-1', 'greetings-cat', 10)
 * console.log(dueCards[0].tl) // 'Kumusta'
 * console.log(dueCards[0].category.name) // 'Greetings'
 * console.log(dueCards[0].examples.length) // 2
 */
export async function getDueCards(
	database: typeof db,
	userId: string,
	categoryId?: string,
	limit?: number,
): Promise<FlashcardData[]> {
	const baseQuery = database
		.select({
			word: words,
			category: categories,
			review: reviews,
		})
		.from(words)
		.innerJoin(categories, eq(words.categoryId, categories.id))
		.leftJoin(reviews, and(eq(reviews.wordId, words.id), eq(reviews.userId, userId)))
		.where(
			and(
				categoryId ? eq(words.categoryId, categoryId) : undefined,
				// Card is due if: no review exists OR next_due <= today
				sql`(${reviews.nextDue} IS NULL OR ${reviews.nextDue} <= CURRENT_DATE)`,
			),
		)
		.orderBy(reviews.nextDue, words.createdAt)

	const results = limit ? await baseQuery.limit(limit) : await baseQuery

	// Get examples for each word
	const flashcards: FlashcardData[] = []
	for (const result of results) {
		const wordExamples = await database
			.select()
			.from(examples)
			.where(eq(examples.wordId, result.word.id))

		flashcards.push({
			...result.word,
			category: result.category,
			examples: wordExamples,
			review: result.review ?? undefined,
		})
	}

	return flashcards
}

/**
 * Counts the number of cards due for review for a user.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @param categoryId - Optional category ID to filter by
 * @returns Promise resolving to count of due cards
 * @example
 * const dueCount = await getDueCardCount(db, 'user-1')
 * console.log(dueCount) // 15
 */
export async function getDueCardCount(
	database: typeof db,
	userId: string,
	categoryId?: string,
): Promise<number> {
	const result = await database
		.select({ count: sql<number>`count(*)` })
		.from(words)
		.leftJoin(reviews, and(eq(reviews.wordId, words.id), eq(reviews.userId, userId)))
		.where(
			and(
				categoryId ? eq(words.categoryId, categoryId) : undefined,
				// Card is due if: no review exists OR next_due <= today
				sql`(${reviews.nextDue} IS NULL OR ${reviews.nextDue} <= CURRENT_DATE)`,
			),
		)

	return result[0]?.count ?? 0
}

/**
 * Retrieves recent review history for a user with word and category details.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @param limit - Maximum number of reviews to return (default: 10)
 * @returns Promise resolving to array of recent reviews with word and category data
 * @example
 * const recentReviews = await getRecentReviews(db, 'user-1', 5)
 * console.log(recentReviews[0].word.tl) // 'Kumusta'
 * console.log(recentReviews[0].category.name) // 'Greetings'
 * console.log(recentReviews[0].ease) // 2.5
 */
export async function getRecentReviews(
	database: typeof db,
	userId: string,
	limit = 10,
): Promise<Array<Review & { word: Word; category: Category }>> {
	const results = await database
		.select({
			review: reviews,
			word: words,
			category: categories,
		})
		.from(reviews)
		.innerJoin(words, eq(reviews.wordId, words.id))
		.innerJoin(categories, eq(words.categoryId, categories.id))
		.where(eq(reviews.userId, userId))
		.orderBy(desc(reviews.lastReviewed))
		.limit(limit)

	return results.map((result) => ({
		...result.review,
		word: result.word,
		category: result.category,
	}))
}

// Progress sync functions

/**
 * Saves user progress data for a word, filling in default values for missing fields.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @param wordId - The ID of the word
 * @param reviewData - Partial review data to save
 * @returns Promise resolving to the saved review data
 * @example
 * const progress = await saveUserProgress(db, 'user-1', 'word-1', {
 *   ease: 2.6,
 *   intervalDays: 4,
 *   reps: 2
 * })
 */
export async function saveUserProgress(
	database: typeof db,
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

	return await createOrUpdateReview(database, fullReviewData)
}

/**
 * Loads all progress data for a user.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @returns Promise resolving to array of all user's review data
 * @example
 * const allProgress = await loadUserProgress(db, 'user-1')
 * console.log(allProgress.length) // 50
 */
export async function loadUserProgress(database: typeof db, userId: string): Promise<Review[]> {
	return await database.select().from(reviews).where(eq(reviews.userId, userId))
}

/**
 * Retrieves comprehensive progress statistics for a user.
 *
 * @param database - The database instance
 * @param userId - The ID of the user
 * @returns Promise resolving to user progress statistics
 * @example
 * const stats = await getUserProgressStats(db, 'user-1')
 * console.log(stats.totalCards) // 100
 * console.log(stats.studiedCards) // 75
 * console.log(stats.dueCards) // 15
 * console.log(stats.averageEase) // 2.7
 */
export async function getUserProgressStats(
	database: typeof db,
	userId: string,
): Promise<{
	totalCards: number
	studiedCards: number
	dueCards: number
	averageEase: number
}> {
	// Get total cards studied (have reviews)
	const studiedResult = await database
		.select({ count: sql<number>`count(*)` })
		.from(reviews)
		.where(eq(reviews.userId, userId))

	// Get due cards count
	const dueResult = await database
		.select({ count: sql<number>`count(*)` })
		.from(reviews)
		.where(and(eq(reviews.userId, userId), lte(reviews.nextDue, sql`CURRENT_DATE`)))

	// Get average ease
	const easeResult = await database
		.select({ avg: sql<number>`avg(${reviews.ease})` })
		.from(reviews)
		.where(eq(reviews.userId, userId))

	// Get total cards available
	const totalResult = await database.select({ count: sql<number>`count(*)` }).from(words)

	return {
		totalCards: totalResult[0]?.count ?? 0,
		studiedCards: studiedResult[0]?.count ?? 0,
		dueCards: dueResult[0]?.count ?? 0,
		averageEase: easeResult[0]?.avg ?? 2.5,
	}
}
