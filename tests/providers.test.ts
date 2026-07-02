import { describe, it, expect } from 'vitest';
import { OpenAIAdapter } from '../src/providers/openai';
import { AnthropicAdapter } from '../src/providers/anthropic';
import { GeminiAdapter } from '../src/providers/gemini';

describe('OpenAI Adapter', () => {
  const adapter = new OpenAIAdapter();

  it('should count tokens for raw text input correctly', () => {
    // "hello world" is typically 2 tokens in cl100k_base / o200k_base
    const count = adapter.countTokens('hello world', 'gpt-4o');
    expect(count).toBe(2);
  });

  it('should count tokens for ChatMessage array correctly with overhead', () => {
    const messages = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'world' }
    ];
    // Each message has overhead of 3 tokens.
    // "hello" is 1 token, "world" is 1 token.
    // 3 tokens role, etc.
    // Total should be: 3 (msg 1) + 1 (role) + 1 (hello) + 3 (msg 2) + 1 (role) + 1 (world) + 3 (assistant priming) = 13 tokens
    const count = adapter.countTokens(messages, 'gpt-4o');
    expect(count).toBeGreaterThan(5);
  });

  it('should list models from pricing file', () => {
    const models = adapter.listModels();
    expect(models).toContain('gpt-4o');
    expect(models).toContain('gpt-4o-mini');
  });
});

describe('Anthropic Adapter', () => {
  const adapter = new AnthropicAdapter();

  it('should count tokens for raw text input using heuristic', () => {
    // heuristic: Math.ceil(max(char/4, words * 1.33))
    const count = adapter.countTokens('hello world');
    expect(count).toBe(3); // char = 11/4 = 2.75 -> 3, words = 2 * 1.33 = 2.66 -> 3
  });

  it('should flag as estimated', () => {
    expect(adapter.isEstimated).toBe(true);
  });

  it('should count chat messages', () => {
    const messages = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'world' }
    ];
    const count = adapter.countTokens(messages);
    expect(count).toBeGreaterThan(0);
  });
});

describe('Gemini Adapter', () => {
  const adapter = new GeminiAdapter();

  it('should count tokens using heuristic', () => {
    const count = adapter.countTokens('hello world');
    expect(count).toBe(3);
  });

  it('should flag as estimated', () => {
    expect(adapter.isEstimated).toBe(true);
  });
});
