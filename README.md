# llm-cost-estimator

Estimate token usage and cost across OpenAI, Anthropic, Gemini, and more — as a programmatic Node.js library, CLI tool, and terminal dashboard.

## Features

- **Offline Token Counting**: Accurate token estimation offline (using `js-tiktoken` for OpenAI and fine-tuned word/char heuristics for Anthropic/Gemini).
- **Offline Cost Logic**: Bundles rates for popular models and merges them with optional local JSON overrides.
- **Library API**: Clean, well-typed programmatic API for TypeScript and JavaScript.
- **CLI Commands**: Direct CLI tool for one-off estimations, piping/logging usage in shell scripts, and CI/CD cost budget checks.
- **Interactive Terminal Dashboard**: Real-time terminal dashboard built with React and Ink that watches log files and refreshes usage stats.

---

## Installation

```bash
npm install llm-cost-estimator
```

To run the CLI tool globally:

```bash
npm install -g llm-cost-estimator
```

---

## Programmatic Library Usage

### 1. Cost & Token Estimation

```typescript
import { estimateCost } from 'llm-cost-estimator';

const result = estimateCost({
  provider: 'openai',
  model: 'gpt-4o-mini',
  input: 'Translate the following phrase: Hello, how are you today?',
  expectedOutputTokens: 150
});

console.log(result);
/*
{
  provider: 'openai',
  model: 'gpt-4o-mini',
  inputTokens: 11,
  outputTokens: 150,
  inputCost: 0.00000165,
  outputCost: 0.00009,
  totalCost: 0.00009165,
  currency: 'USD',
  pricingSource: 'bundled',
  estimated: false
}
*/
```

### 2. Model Comparison

Compare cost across multiple candidate models to select the best/cheapest option:

```typescript
import { compareModels } from 'llm-cost-estimator';

const results = compareModels({
  input: 'Draft a short email.',
  expectedOutputTokens: 100,
  candidates: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' }
  ]
});

// Results are returned sorted from cheapest to most expensive
console.log(results);
```

### 3. Usage Logging & Summarization

Log runs to a local `.jsonl` log file and generate aggregate statistics:

```typescript
import { logUsage, getUsageSummary } from 'llm-cost-estimator';

// Log actual API consumption post-request
logUsage({
  provider: 'openai',
  model: 'gpt-4o',
  inputTokens: 850,
  outputTokens: 250,
  tag: 'production-v1'
});

// Fetch summary grouped by model, provider, tag, or day
const summary = getUsageSummary({
  groupBy: 'model',
  since: '24h' // accepts '24h', '7d', '30d' or Date object
});
```

---

## CLI Usage

### 1. Estimate Cost

Estimate tokens and cost for a prompt directly:

```bash
llm-cost estimate -p openai -m gpt-4o-mini -i "Hello world" -o 50
```

Read input from a text file:

```bash
llm-cost estimate -p openai -m gpt-4o -f prompt.txt -o 100
```

Pipe stdin:

```bash
cat prompt.txt | llm-cost estimate -p anthropic -m claude-3-5-sonnet -o 200
```

Add a max cost constraint for CI/CD checks:

```bash
llm-cost estimate -p openai -m gpt-4o -i "Perform a complex build" --max-cost 0.005
```

Output results as JSON:

```bash
llm-cost estimate -p openai -m gpt-4o -i "Query" --json
```

### 2. Compare Models

Compare pricing for a prompt across several candidate models:

```bash
llm-cost compare openai/gpt-4o openai/gpt-4o-mini anthropic/claude-3-5-sonnet -i "Compare performance of these systems"
```

### 3. Log Usage

Manually append a run to the usage log:

```bash
llm-cost log -p openai -m gpt-4o -i 1000 -o 400 --tag release-test
```

### 4. Summary

Print tabular summaries of logged runs:

```bash
llm-cost summary --group-by model --since 7d
```

### 5. Interactive Dashboard

Open the live-updating terminal usage dashboard (built with Ink and React):

```bash
llm-cost dashboard
```

---

## Configuration & Pricing Overrides

You can override default pricing rates or define new models by creating a JSON configuration file.

By default, the library looks for overrides at `~/.llm-cost-estimator/pricing-override.json`. You can also point to a custom file via the `LLM_COST_PRICING_OVERRIDE` environment variable.

Example override structure:

```json
{
  "currency": "USD",
  "models": {
    "openai/gpt-4o": {
      "inputPer1M": 2.00,
      "outputPer1M": 8.00
    },
    "custom-provider/my-new-model": {
      "inputPer1M": 1.00,
      "outputPer1M": 4.00
    }
  }
}
```

---

## License

MIT © [Mayank Sardhara](https://github.com/mayank8025)
