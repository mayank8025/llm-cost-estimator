#!/usr/bin/env node

import { Command } from 'commander';
import { handleEstimate } from './commands/estimate.js';
import { handleCompare } from './commands/compare.js';
import { handleLog } from './commands/log.js';
import { handleSummary } from './commands/summary.js';
import { handleUpdatePricing } from './commands/update-pricing.js';

const program = new Command();

program
  .name('llm-cost')
  .description('Estimate and log token usage and cost for LLM runs across multiple providers.')
  .version('0.1.0');

program
  .command('estimate')
  .description('Estimate tokens and costs for a given input.')
  .option('-p, --provider <provider>', 'LLM provider name (openai, anthropic, gemini)')
  .option('-m, --model <model>', 'Model identifier (e.g. gpt-4o)')
  .option('-o, --output-tokens <tokens>', 'Expected number of output/completion tokens', '0')
  .option('-i, --input <string>', 'Direct prompt string input')
  .option('-f, --file <path>', 'Path to file containing prompt text')
  .option('--max-cost <limit>', 'Maximum allowed cost in currency (e.g. 0.05). Fails if exceeded.')
  .option('--json', 'Output results as raw JSON instead of tables')
  .action((options) => {
    handleEstimate(options);
  });

program
  .command('compare')
  .description('Compare costs of an input prompt across different models.')
  .argument('<candidates...>', 'Space-separated candidate models in provider/model format (e.g. openai/gpt-4o)')
  .option('-o, --output-tokens <tokens>', 'Expected number of output/completion tokens', '0')
  .option('-i, --input <string>', 'Direct prompt string input')
  .option('-f, --file <path>', 'Path to file containing prompt text')
  .option('--json', 'Output results as raw JSON instead of tables')
  .action((candidates, options) => {
    handleCompare(candidates, options);
  });

program
  .command('log')
  .description('Manually log a run to the local usage log.')
  .option('-p, --provider <provider>', 'LLM provider name (openai, anthropic, gemini)')
  .option('-m, --model <model>', 'Model identifier (e.g. gpt-4o)')
  .option('-i, --input-tokens <tokens>', 'Actual number of input/prompt tokens used')
  .option('-o, --output-tokens <tokens>', 'Actual number of output/completion tokens used')
  .option('-t, --tag <tag>', 'Optional categorization tag for grouping')
  .action((options) => {
    handleLog(options);
  });

program
  .command('summary')
  .description('Show aggregated statistics and summaries of usage logs.')
  .option('-g, --group-by <type>', 'Group results by: model, provider, tag, day', 'model')
  .option('-t, --tag <tag>', 'Filter records by a specific tag')
  .option('-s, --since <since>', 'Filter records since date or timeframe (e.g., "24h", "7d", "2026-07-01")')
  .option('--json', 'Output results as raw JSON list instead of tables')
  .action((options) => {
    handleSummary(options);
  });

program
  .command('update-pricing')
  .description('Check and load the latest available pricing data.')
  .action(() => {
    handleUpdatePricing();
  });

program
  .command('dashboard')
  .description('Open the live terminal usage dashboard.')
  .action(async () => {
    // Lazily load the dashboard module to speed up start times for basic CLI commands
    try {
      const { startDashboard } = await import('../dashboard/render.js');
      await startDashboard();
    } catch (err) {
      console.error(`Error starting dashboard: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
