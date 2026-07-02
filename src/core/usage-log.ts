import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { UsageRecord, Provider } from '../types.js';
import { loadPricing } from '../pricing/pricing-loader.js';

/**
 * Gets the configured path to the usage log file.
 */
export function getUsageLogPath(): string {
  if (process.env.LLM_COST_LOG_PATH) {
    return path.resolve(process.env.LLM_COST_LOG_PATH);
  }
  return path.join(os.homedir(), '.llm-cost-estimator', 'usage.jsonl');
}

/**
 * Appends a usage record to the JSON Lines file.
 */
export function logUsage(record: Omit<UsageRecord, 'timestamp'> & { timestamp?: number }): void {
  const logPath = getUsageLogPath();
  const dir = path.dirname(logPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fullRecord: UsageRecord = {
    ...record,
    timestamp: record.timestamp || Date.now(),
  };

  const line = JSON.stringify(fullRecord) + '\n';
  fs.appendFileSync(logPath, line, 'utf8');
}

export interface SummaryFilters {
  groupBy?: 'model' | 'provider' | 'tag' | 'day';
  since?: string | number | Date;
  tag?: string;
}

export interface UsageSummaryGroup {
  groupKey: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  count: number;
}

/**
 * Reads all usage records from the log file.
 */
export function readUsageRecords(): UsageRecord[] {
  const logPath = getUsageLogPath();
  if (!fs.existsSync(logPath)) {
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line) as UsageRecord;
      } catch {
        return null;
      }
    })
    .filter((record): record is UsageRecord => record !== null);
}

/**
 * Computes aggregated usage summaries.
 */
export function getUsageSummary(filters: SummaryFilters = {}): UsageSummaryGroup[] {
  const records = readUsageRecords();
  const { data: pricingData } = loadPricing();

  const groupBy = filters.groupBy || 'model';
  const sinceTime = filters.since ? new Date(filters.since).getTime() : 0;

  // Filter records
  const filtered = records.filter(record => {
    if (record.timestamp < sinceTime) return false;
    if (filters.tag && record.tag !== filters.tag) return false;
    return true;
  });

  const aggregates: Record<string, Omit<UsageSummaryGroup, 'groupKey'>> = {};

  for (const record of filtered) {
    let key = '';
    switch (groupBy) {
      case 'provider':
        key = record.provider;
        break;
      case 'tag':
        key = record.tag || 'untagged';
        break;
      case 'day':
        key = new Date(record.timestamp).toISOString().split('T')[0];
        break;
      case 'model':
      default:
        key = `${record.provider}/${record.model}`;
        break;
    }

    // Cost calculation based on active pricing
    const pricingKey = `${record.provider}/${record.model}`;
    const rates = pricingData.models[pricingKey] || { inputPer1M: 0, outputPer1M: 0 };
    const cost = (record.inputTokens * rates.inputPer1M + record.outputTokens * rates.outputPer1M) / 1_000_000;

    if (!aggregates[key]) {
      aggregates[key] = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        count: 0,
      };
    }

    const group = aggregates[key];
    group.inputTokens += record.inputTokens;
    group.outputTokens += record.outputTokens;
    group.totalTokens += record.inputTokens + record.outputTokens;
    group.totalCost += cost;
    group.count += 1;
  }

  return Object.entries(aggregates).map(([groupKey, stats]) => ({
    groupKey,
    ...stats,
  }));
}
