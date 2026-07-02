import { logUsage } from '../../core/usage-log.js';
import { Provider } from '../../types.js';

export interface LogCommandOptions {
  provider: string;
  model: string;
  inputTokens: string;
  outputTokens: string;
  tag?: string;
}

export function handleLog(options: LogCommandOptions): void {
  const { provider, model, inputTokens, outputTokens, tag } = options;

  if (!provider) {
    console.error('Error: Required option "-p, --provider <provider>" is missing.');
    process.exit(1);
  }
  if (!model) {
    console.error('Error: Required option "-m, --model <model>" is missing.');
    process.exit(1);
  }
  if (inputTokens === undefined) {
    console.error('Error: Required option "-i, --input-tokens <tokens>" is missing.');
    process.exit(1);
  }
  if (outputTokens === undefined) {
    console.error('Error: Required option "-o, --output-tokens <tokens>" is missing.');
    process.exit(1);
  }

  const inTokens = parseInt(inputTokens, 10);
  const outTokens = parseInt(outputTokens, 10);

  if (isNaN(inTokens) || inTokens < 0) {
    console.error('Error: Input tokens must be a non-negative integer.');
    process.exit(1);
  }
  if (isNaN(outTokens) || outTokens < 0) {
    console.error('Error: Output tokens must be a non-negative integer.');
    process.exit(1);
  }

  try {
    logUsage({
      provider: provider as Provider,
      model,
      inputTokens: inTokens,
      outputTokens: outTokens,
      tag,
    });

    console.log(`Successfully logged run to usage log:`);
    console.log(`  Provider:     ${provider}`);
    console.log(`  Model:        ${model}`);
    console.log(`  Input Tokens: ${inTokens}`);
    console.log(`  Output Tokens:${outTokens}`);
    if (tag) {
      console.log(`  Tag:          ${tag}`);
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
