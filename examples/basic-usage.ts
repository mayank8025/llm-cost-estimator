import { estimateCost, compareModels, logUsage, getUsageSummary } from '../src/index.js';

console.log('=== 1. Basic Cost Estimation ===');
const result = estimateCost({
  provider: 'openai',
  model: 'gpt-4o-mini',
  input: 'Hello, what is the capital of France?',
  expectedOutputTokens: 50,
});
console.log(`Estimated cost for gpt-4o-mini: $${result.totalCost.toFixed(6)} (${result.inputTokens} input tokens, ${result.outputTokens} expected output tokens)`);

console.log('\n=== 2. Compare Models ===');
const comparison = compareModels({
  input: 'Write a quicksort implementation in TypeScript.',
  expectedOutputTokens: 200,
  candidates: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
  ],
});

console.log('Comparison results (cheapest first):');
comparison.forEach((res, i) => {
  console.log(`${i + 1}. ${res.provider}/${res.model}: $${res.totalCost.toFixed(6)} (Tokens: ${res.inputTokens + res.outputTokens})`);
});

console.log('\n=== 3. Logging & Usage Summary ===');
// Manually log some runs
logUsage({
  provider: 'openai',
  model: 'gpt-4o',
  inputTokens: 1500,
  outputTokens: 500,
  tag: 'production-app',
});

logUsage({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  inputTokens: 2000,
  outputTokens: 800,
  tag: 'production-app',
});

const summary = getUsageSummary({ groupBy: 'provider' });
console.log('Usage summary grouped by provider:');
console.log(JSON.stringify(summary, null, 2));
