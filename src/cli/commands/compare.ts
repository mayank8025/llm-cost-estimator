import * as fs from 'fs';
import * as path from 'path';
import { compareModels } from '../../core/compare.js';
import { renderCompareTable } from '../format.js';
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

export interface CompareCommandOptions {
  outputTokens?: string;
  input?: string;
  file?: string;
  json?: boolean;
}

export async function handleCompare(
  candidates: string[],
  options: CompareCommandOptions
): Promise<void> {
  if (!candidates || candidates.length === 0) {
    console.error('Error: Please specify at least one candidate model in the format "provider/model" (e.g. openai/gpt-4o).');
    process.exit(1);
  }

  let promptText = '';

  if (options.input) {
    promptText = options.input;
  } else if (options.file) {
    const resolvedPath = path.resolve(options.file);
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

  const expectedOutputTokens = options.outputTokens ? parseInt(options.outputTokens, 10) : 0;
  if (isNaN(expectedOutputTokens) || expectedOutputTokens < 0) {
    console.error('Error: Expected output tokens must be a non-negative integer.');
    process.exit(1);
  }

  const parsedCandidates = candidates.map(c => {
    const parts = c.split('/');
    if (parts.length !== 2) {
      console.error(`Error: Invalid candidate format "${c}". Must be "provider/model" (e.g., "openai/gpt-4o").`);
      process.exit(1);
    }
    return {
      provider: parts[0] as Provider,
      model: parts[1],
    };
  });

  try {
    const results = compareModels({
      input: promptText,
      expectedOutputTokens,
      candidates: parsedCandidates,
    });

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(renderCompareTable(results));
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
