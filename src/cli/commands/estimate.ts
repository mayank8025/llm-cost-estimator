import * as fs from 'fs';
import * as path from 'path';
import { estimateCost } from '../../core/estimate.js';
import { renderEstimateTable } from '../format.js';
import { Provider } from '../../types.js';

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', err => {
      reject(err);
    });
  });
}

export interface EstimateCommandOptions {
  provider: string;
  model: string;
  outputTokens?: string;
  input?: string;
  file?: string;
  maxCost?: string;
  json?: boolean;
}

export async function handleEstimate(options: EstimateCommandOptions): Promise<void> {
  const { provider, model, outputTokens, input, file, maxCost, json } = options;

  if (!provider) {
    console.error('Error: Required option "-p, --provider <provider>" is missing.');
    process.exit(1);
  }
  if (!model) {
    console.error('Error: Required option "-m, --model <model>" is missing.');
    process.exit(1);
  }

  let promptText = '';

  if (input) {
    promptText = input;
  } else if (file) {
    const resolvedPath = path.resolve(file);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found at "${resolvedPath}"`);
      process.exit(1);
    }
    promptText = fs.readFileSync(resolvedPath, 'utf8');
  } else {
    promptText = await readStdin();
    if (!promptText) {
      console.error('Error: No input provided. Use --input, --file, or pipe input via stdin.');
      process.exit(1);
    }
  }

  const expectedOutputTokens = outputTokens ? parseInt(outputTokens, 10) : 0;
  if (isNaN(expectedOutputTokens) || expectedOutputTokens < 0) {
    console.error('Error: Expected output tokens must be a non-negative integer.');
    process.exit(1);
  }

  try {
    const result = estimateCost({
      provider: provider as Provider,
      model,
      input: promptText,
      expectedOutputTokens,
    });

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(renderEstimateTable(result));
    }

    if (maxCost) {
      const limit = parseFloat(maxCost);
      if (!isNaN(limit) && result.totalCost > limit) {
        console.error(
          `Error: Estimated total cost of ${result.totalCost.toFixed(6)} exceeds limit of ${limit.toFixed(6)}`
        );
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
