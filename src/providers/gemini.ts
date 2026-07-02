import { ProviderAdapter, InputText } from '../types.js';
import { loadPricing } from '../pricing/pricing-loader.js';

export class GeminiAdapter implements ProviderAdapter {
  readonly id = 'gemini';
  readonly isEstimated = true;

  /**
   * Estimates tokens for Gemini models offline.
   * On average:
   * - 1 token ≈ 4 characters in English text.
   * - 1 token ≈ 0.75 words.
   * We apply a margin of safety for code/formatting: max of (chars/4, words*1.3).
   */
  private estimateTokensFromText(text: string): number {
    if (!text) return 0;
    const charTokens = text.length / 4.0;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const wordTokens = wordCount * 1.33;
    return Math.ceil(Math.max(charTokens, wordTokens, 1));
  }

  countTokens(input: InputText, model?: string): number {
    if (typeof input === 'string') {
      return this.estimateTokensFromText(input);
    }

    // Chat formats:
    // Approximately 3 tokens overhead per conversational turn
    let totalTokens = 0;
    for (const msg of input) {
      totalTokens += 3;
      totalTokens += this.estimateTokensFromText(msg.role);
      totalTokens += this.estimateTokensFromText(msg.content);
    }
    totalTokens += 3;
    return totalTokens;
  }

  listModels(): string[] {
    const pricing = loadPricing();
    return Object.keys(pricing.data.models)
      .filter(key => key.startsWith('gemini/'))
      .map(key => key.replace('gemini/', ''));
  }
}
