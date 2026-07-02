import { ProviderAdapter, InputText } from '../types.js';
import { loadPricing } from '../pricing/pricing-loader.js';

export class AnthropicAdapter implements ProviderAdapter {
  readonly id = 'anthropic';
  
  // Since we use a heuristic offline estimation, this is flagged as estimated.
  readonly isEstimated = true;

  /**
   * Estimates tokens for Claude models using a hybrid word-and-character heuristic.
   * On average:
   * - 1 token ≈ 4 characters in English.
   * - 1 token ≈ 0.75 words (1.33 tokens per word).
   * We take the maximum of these heuristics to provide a safe, conservative estimate
   * with a typical margin of error within ±10%.
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

    // Chat format overhead estimation:
    // Approximately 3 tokens overhead per role/message pair + content tokens
    let totalTokens = 0;
    for (const msg of input) {
      totalTokens += 3; // role wrapper tokens
      totalTokens += this.estimateTokensFromText(msg.role);
      totalTokens += this.estimateTokensFromText(msg.content);
    }
    totalTokens += 3; // final assistant response prefix overhead
    return totalTokens;
  }

  listModels(): string[] {
    const pricing = loadPricing();
    return Object.keys(pricing.data.models)
      .filter(key => key.startsWith('anthropic/'))
      .map(key => key.replace('anthropic/', ''));
  }
}
