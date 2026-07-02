import { estimateCost } from '../src/index.js';

// Define a strict budget for a single LLM call (e.g. $0.005)
const BUDGET_LIMIT = 0.005;

// Mock input for a code generation task
const promptTemplate = `
You are an expert system. Refactor the following code to make it cleaner and more performant.
Code:
${Array(100).fill('const x = 1;').join('\n')}
`;

console.log('Running CI/CD budget check...');
console.log(`Max budget allowed: $${BUDGET_LIMIT}`);

try {
  const estimation = estimateCost({
    provider: 'openai',
    model: 'gpt-4o',
    input: promptTemplate,
    expectedOutputTokens: 500, // expect a large refactoring output
  });

  console.log(`Estimated input tokens:  ${estimation.inputTokens}`);
  console.log(`Estimated output tokens: ${estimation.outputTokens}`);
  console.log(`Estimated total cost:    $${estimation.totalCost.toFixed(6)}`);

  if (estimation.totalCost > BUDGET_LIMIT) {
    console.error(`\x1b[31m[FAILURE] Estimated cost ($${estimation.totalCost.toFixed(6)}) exceeds budget limit of $${BUDGET_LIMIT}!\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m[SUCCESS] Cost check passed! ($${estimation.totalCost.toFixed(6)} is within budget)\x1b[0m`);
    process.exit(0);
  }
} catch (err) {
  console.error(`Error estimating cost: ${(err as Error).message}`);
  process.exit(1);
}
