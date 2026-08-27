/**
 * Smart Category Suggestion Engine
 *
 * Learns from the user's expense history to suggest categories.
 * Two-layer approach:
 *   1. History-based: builds a frequency map from past description→category pairs
 *   2. Keyword-based fallback: uses the NL parser's keyword dictionary
 *
 * All local, no cloud dependency.
 */

import { Expense } from '../types';
import { getCategoryFromText } from './nlParser';

export interface CategorySuggestion {
  category: string;
  confidence: number; // 0-1
  source: 'history' | 'keyword';
}

/**
 * Build a description→category frequency map from expense history.
 * Groups by normalized description words and tracks which category each word maps to most often.
 */
function buildWordCategoryMap(expenses: Expense[]): Map<string, Map<string, number>> {
  const wordMap = new Map<string, Map<string, number>>();

  for (const expense of expenses) {
    if (!expense.description) continue;
    const category = expense.category;
    const words = normalizeText(expense.description);

    for (const word of words) {
      if (word.length < 2) continue; // skip single chars
      if (!wordMap.has(word)) {
        wordMap.set(word, new Map());
      }
      const catMap = wordMap.get(word)!;
      catMap.set(category, (catMap.get(category) || 0) + 1);
    }
  }

  return wordMap;
}

/**
 * Normalize text into searchable words.
 */
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Suggest a category based on description text and expense history.
 *
 * @param description - The expense description to analyze
 * @param expenses - The user's expense history (for learning)
 * @param customCategoryNames - Names of user's custom categories (to include in results)
 * @returns CategorySuggestion or null if no confident suggestion
 */
export function suggestCategory(
  description: string,
  expenses: Expense[],
  customCategoryNames: string[] = []
): CategorySuggestion | null {
  if (!description || description.trim().length < 2) return null;

  // Layer 1: History-based suggestion
  const historySuggestion = suggestFromHistory(description, expenses);
  if (historySuggestion && historySuggestion.confidence >= 0.5) {
    return historySuggestion;
  }

  // Layer 2: Keyword-based fallback
  const keywordCategory = getCategoryFromText(description);
  if (keywordCategory) {
    return {
      category: keywordCategory,
      confidence: 0.7, // keyword matches are fairly reliable
      source: 'keyword',
    };
  }

  // Return low-confidence history suggestion if we have one
  if (historySuggestion) {
    return historySuggestion;
  }

  return null;
}

/**
 * Suggest category from expense history using word-frequency matching.
 */
function suggestFromHistory(
  description: string,
  expenses: Expense[]
): CategorySuggestion | null {
  if (expenses.length < 3) return null; // need minimum history

  const wordMap = buildWordCategoryMap(expenses);
  const inputWords = normalizeText(description);

  if (inputWords.length === 0) return null;

  // Score each category by how many input words map to it
  const categoryScores = new Map<string, { score: number; total: number }>();

  for (const word of inputWords) {
    const catFreqs = wordMap.get(word);
    if (!catFreqs) continue;

    // Find total occurrences of this word
    let wordTotal = 0;
    for (const count of catFreqs.values()) {
      wordTotal += count;
    }

    // Add weighted score for each category this word maps to
    for (const [cat, count] of catFreqs.entries()) {
      if (!categoryScores.has(cat)) {
        categoryScores.set(cat, { score: 0, total: 0 });
      }
      const entry = categoryScores.get(cat)!;
      // Weight by (frequency of this word→category) / (total uses of this word)
      entry.score += count / wordTotal;
      entry.total += 1;
    }
  }

  if (categoryScores.size === 0) return null;

  // Find best category
  let bestCategory = '';
  let bestScore = 0;
  let totalMatchedWords = 0;

  for (const [cat, { score, total }] of categoryScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
      totalMatchedWords = total;
    }
  }

  if (!bestCategory) return null;

  // Confidence based on:
  // - How many input words matched (coverage)
  // - How dominant the winning category is (specificity)
  const coverage = totalMatchedWords / inputWords.length;
  const confidence = Math.min(bestScore * coverage, 1);

  // Also check for exact description match (highest confidence)
  const exactMatch = findExactDescriptionMatch(description, expenses);
  if (exactMatch) {
    return {
      category: exactMatch,
      confidence: 0.95,
      source: 'history',
    };
  }

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    source: 'history',
  };
}

/**
 * Check if the exact description (normalized) was used before.
 */
function findExactDescriptionMatch(
  description: string,
  expenses: Expense[]
): string | null {
  const normalized = description.toLowerCase().trim();
  if (normalized.length < 2) return null;

  // Count category occurrences for this exact description
  const catCounts = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.description?.toLowerCase().trim() === normalized) {
      catCounts.set(expense.category, (catCounts.get(expense.category) || 0) + 1);
    }
  }

  if (catCounts.size === 0) return null;

  // Return the most common category for this description
  let best = '';
  let bestCount = 0;
  for (const [cat, count] of catCounts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }

  return best || null;
}

/**
 * Get top N category suggestions for autocomplete/ranking.
 * Returns sorted by confidence (highest first).
 */
export function getTopSuggestions(
  description: string,
  expenses: Expense[],
  limit: number = 3
): CategorySuggestion[] {
  if (!description || description.trim().length < 2) return [];

  const wordMap = buildWordCategoryMap(expenses);
  const inputWords = normalizeText(description);
  if (inputWords.length === 0) return [];

  const categoryScores = new Map<string, number>();

  for (const word of inputWords) {
    const catFreqs = wordMap.get(word);
    if (!catFreqs) continue;

    let wordTotal = 0;
    for (const count of catFreqs.values()) wordTotal += count;

    for (const [cat, count] of catFreqs.entries()) {
      categoryScores.set(cat, (categoryScores.get(cat) || 0) + count / wordTotal);
    }
  }

  // Also check keyword-based
  const keywordCat = getCategoryFromText(description);
  if (keywordCat && !categoryScores.has(keywordCat)) {
    categoryScores.set(keywordCat, 0.7);
  }

  return Array.from(categoryScores.entries())
    .map(([category, score]) => ({
      category,
      confidence: Math.min(score, 1),
      source: (score >= 0.7 && category === keywordCat ? 'keyword' : 'history') as 'history' | 'keyword',
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
