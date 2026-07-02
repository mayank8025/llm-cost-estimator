import { getEncoding, encodingForModel, Tiktoken, TiktokenEncoding } from 'js-tiktoken';
import { ProviderAdapter, InputText } from '../types.js';
import { loadPricing } from '../pricing/pricing-loader.js';

export class OpenAIAdapter implements ProviderAdapter {
  readonly id = 'openai';
  readonly isEstimated = false;

  private encodings: Map<string, Tiktoken> = new Map();

  private getEncodingForModel(model: string): Tiktoken {
    const canonicalModel = this.getCanonicalModel(model);
    if (this.encodings.has(canonicalModel)) {
      return this.encodings.get(canonicalModel)!;
    }

    let encoding: Tiktoken;
    try {
      // js-tiktoken support for o1, gpt-4o, etc.
      encoding = encodingForModel(canonicalModel as any);
    } catch {
      // Fallback strategies for unrecognized models
      try {
        if (canonicalModel.startsWith('o1') || canonicalModel.startsWith('o3') || canonicalModel.includes('gpt-4o')) {
          encoding = getEncoding('o200k_base');
        } else {
          encoding = getEncoding('cl100k_base');
        }
      } catch {
        encoding = getEncoding('cl100k_base');
      }
    }

    this.encodings.set(canonicalModel, encoding);
    return encoding;
  }

  private getCanonicalModel(model: string): string {
    const clean = model.toLowerCase();
    if (clean.startsWith('gpt-4o-mini')) return 'gpt-4o-mini';
    if (clean.startsWith('gpt-4o')) return 'gpt-4o';
    if (clean.startsWith('gpt-4')) return 'gpt-4';
    if (clean.startsWith('gpt-3.5')) return 'gpt-3.5-turbo';
    if (clean.startsWith('o1')) return 'o1-preview'; // typical tiktoken lookup
    if (clean.startsWith('o3')) return 'gpt-4o'; // fallback
    return model;
  }

  countTokens(input: InputText, model: string = 'gpt-4o'): number {
    const encoding = this.getEncodingForModel(model);

    if (typeof input === 'string') {
      return encoding.encode(input).length;
    }

    // Chat API overhead calculation
    // rule of thumb from OpenAI Cookbook for newer models:
    // 3 tokens per message + tokens in role & content + 3 tokens final priming
    let totalTokens = 0;
    for (const message of input) {
      totalTokens += 3;
      totalTokens += encoding.encode(message.role || '').length;
      totalTokens += encoding.encode(message.content || '').length;
    }
    totalTokens += 3; // priming the assistant response
    return totalTokens;
  }

  listModels(): string[] {
    const pricing = loadPricing();
    return Object.keys(pricing.data.models)
      .filter(key => key.startsWith('openai/'))
      .map(key => key.replace('openai/', ''));
  }
}
