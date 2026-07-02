import { Provider, ProviderAdapter } from '../types.js';
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';
import { GeminiAdapter } from './gemini.js';

const registry = new Map<Provider, ProviderAdapter>();

// Register standard adapters
registry.set('openai', new OpenAIAdapter());
registry.set('anthropic', new AnthropicAdapter());
registry.set('gemini', new GeminiAdapter());

/**
 * Gets a registered adapter for a given provider.
 * Throws an error if not found.
 */
export function getAdapter(provider: Provider): ProviderAdapter {
  const adapter = registry.get(provider);
  if (!adapter) {
    throw new Error(`Unsupported provider: "${provider}". Must be one of: ${Array.from(registry.keys()).join(', ')}`);
  }
  return adapter;
}

/**
 * Registers a new provider adapter.
 */
export function registerAdapter(provider: Provider, adapter: ProviderAdapter): void {
  registry.set(provider, adapter);
}

/**
 * Lists all registered provider IDs.
 */
export function listProviders(): Provider[] {
  return Array.from(registry.keys());
}

export { registry };
