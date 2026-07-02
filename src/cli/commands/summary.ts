import { getUsageSummary } from '../../core/usage-log.js';
import { renderSummaryTable } from '../format.js';

function parseSince(sinceStr?: string): Date | undefined {
  if (!sinceStr) return undefined;
  const match = sinceStr.match(/^(\d+)(h|d)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === 'h' ? num * 60 * 60 * 1000 : num * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }
  const date = new Date(sinceStr);
  if (isNaN(date.getTime())) {
    console.warn(`Warning: Could not parse date "${sinceStr}". Showing all records.`);
    return undefined;
  }
  return date;
}

export interface SummaryCommandOptions {
  groupBy?: string;
  tag?: string;
  since?: string;
  json?: boolean;
}

export function handleSummary(options: SummaryCommandOptions): void {
  const { groupBy = 'model', tag, since, json } = options;

  const validGroups = ['model', 'provider', 'tag', 'day'];
  if (!validGroups.includes(groupBy)) {
    console.error(`Error: Invalid group-by option "${groupBy}". Must be one of: ${validGroups.join(', ')}`);
    process.exit(1);
  }

  const sinceDate = parseSince(since);

  try {
    const summary = getUsageSummary({
      groupBy: groupBy as 'model' | 'provider' | 'tag' | 'day',
      tag,
      since: sinceDate,
    });

    if (json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      if (summary.length === 0) {
        console.log('No usage records found matching filters.');
      } else {
        console.log(renderSummaryTable(summary));
      }
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
