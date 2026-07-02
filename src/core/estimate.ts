import { EstimateInput, EstimateResult, Provider, InputText } from '../types.js';
import { getAdapter } from '../providers/registry.js';
import { loadPricing } from '../pricing/pricing-loader.js';

/**
 * Estimates the token count of a given input string or chat message list for a specific provider.
 */
export function estimateTokens(options: { provider: Provider; model: string; input: InputText }): number {
  const adapter = getAdapter(options.provider);
  return adapter.countTokens(options.input, options.model);
}

/**
 * Estimates the input tokens, expected output tokens, and total cost of a run.
 */
export function estimateCost(options: EstimateInput): EstimateResult {
  const { provider, model, input, expectedOutputTokens = 0 } = options;
  const adapter = getAdapter(provider);

  // 1. Count input tokens
  const inputTokens = adapter.countTokens(input, model);

  // 2. Load pricing rates
  const { data: pricingData, source: pricingSource } = loadPricing();
  const pricingKey = `${provider}/${model}`;
  const modelPricing = pricingData.models[pricingKey];

  if (!modelPricing) {
    const availableModels = Object.keys(pricingData.models)
      .filter(k => k.startsWith(`${provider}/`))
      .map(k => k.split('/')[1])
      .join(', ');
    throw new Error(
      `Model "${model}" not found for provider "${provider}" in pricing. ` +
      `Available models: ${availableModels || 'none'}`
    );
  }

  // 3. Compute cost (pricing is per 1M tokens)
  const inputCost = (inputTokens * modelPricing.inputPer1M) / 1_000_000;
  const outputCost = (expectedOutputTokens * modelPricing.outputPer1M) / 1_000_000;
  const totalCost = inputCost + outputCost;

  return {
    provider,
    model,
    inputTokens,
    outputTokens: expectedOutputTokens,
    inputCost,
    outputCost,
    totalCost,
    currency: pricingData.currency || 'USD',
    pricingSource,
    estimated: adapter.isEstimated,
  };
}
