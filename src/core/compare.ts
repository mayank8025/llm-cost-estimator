import { EstimateResult, InputText, Provider } from '../types.js';
import { estimateCost } from './estimate.js';

export interface ComparisonCandidate {
  provider: Provider;
  model: string;
}

export interface CompareModelsOptions {
  input: InputText;
  expectedOutputTokens?: number;
  candidates: ComparisonCandidate[];
}

/**
 * Compares a single prompt input across multiple models, returning a list of EstimateResults
 * sorted by totalCost in ascending order (cheapest first).
 */
export function compareModels(options: CompareModelsOptions): EstimateResult[] {
  const { input, expectedOutputTokens = 0, candidates } = options;

  const results: EstimateResult[] = [];

  for (const candidate of candidates) {
    try {
      const result = estimateCost({
        provider: candidate.provider,
        model: candidate.model,
        input,
        expectedOutputTokens,
      });
      results.push(result);
    } catch (err) {
      // If a model pricing isn't configured, we can log or just skip it
      // Let's rethrow or keep it depending on expectation. Usually we skip or log warning.
      // Let's propagate the error or catch it. Better to propagate or capture errors in a separate array if needed.
      // Actually, throwing the error makes it clear to developers that they passed an invalid candidate.
      // Let's propagate it to be strict and helpful, or wrap it. Let's propagate.
      throw err;
    }
  }

  // Sort by totalCost (cheapest first), with totalTokens as tie breaker, then alphabetical model name
  return results.sort((a, b) => {
    if (a.totalCost !== b.totalCost) {
      return a.totalCost - b.totalCost;
    }
    const aTokens = a.inputTokens + a.outputTokens;
    const bTokens = b.inputTokens + b.outputTokens;
    if (aTokens !== bTokens) {
      return aTokens - bTokens;
    }
    return a.model.localeCompare(b.model);
  });
}
