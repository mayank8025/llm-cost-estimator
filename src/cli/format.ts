import Table from 'cli-table3';
import chalk from 'chalk';
import { EstimateResult } from '../types.js';
import { UsageSummaryGroup } from '../core/usage-log.js';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  if (amount === 0) return symbol + '0.00';
  if (amount < 0.01) {
    return symbol + amount.toFixed(6);
  }
  return symbol + amount.toFixed(4);
}

export function formatTokens(num: number): string {
  return num.toLocaleString();
}

export function renderEstimateTable(result: EstimateResult): string {
  const table = new Table({
    head: [chalk.cyan('Metric'), chalk.cyan('Value')],
    colWidths: [20, 30],
  });

  table.push(
    [chalk.bold('Provider'), result.provider],
    [chalk.bold('Model'), result.model],
    [chalk.bold('Input Tokens'), `${formatTokens(result.inputTokens)}${result.estimated ? ' (est.)' : ''}`],
    [chalk.bold('Output Tokens'), formatTokens(result.outputTokens)],
    [chalk.bold('Input Cost'), formatCurrency(result.inputCost, result.currency)],
    [chalk.bold('Output Cost'), formatCurrency(result.outputCost, result.currency)],
    [chalk.bold('Total Cost'), chalk.green(formatCurrency(result.totalCost, result.currency))],
    [chalk.bold('Pricing Source'), result.pricingSource]
  );

  return table.toString();
}

export function renderCompareTable(results: EstimateResult[]): string {
  const table = new Table({
    head: [
      chalk.cyan('Provider'),
      chalk.cyan('Model'),
      chalk.cyan('Input Tokens'),
      chalk.cyan('Output Tokens'),
      chalk.cyan('Est. Cost'),
      chalk.cyan('Source'),
    ],
  });

  results.forEach(res => {
    table.push([
      res.provider,
      res.model,
      `${formatTokens(res.inputTokens)}${res.estimated ? ' (est.)' : ''}`,
      formatTokens(res.outputTokens),
      chalk.green(formatCurrency(res.totalCost, res.currency)),
      res.pricingSource,
    ]);
  });

  return table.toString();
}

export function renderSummaryTable(groups: UsageSummaryGroup[]): string {
  const table = new Table({
    head: [
      chalk.cyan('Group / Key'),
      chalk.cyan('Runs'),
      chalk.cyan('Input Tokens'),
      chalk.cyan('Output Tokens'),
      chalk.cyan('Total Tokens'),
      chalk.cyan('Total Cost'),
    ],
  });

  let grandRuns = 0;
  let grandInput = 0;
  let grandOutput = 0;
  let grandTotalTokens = 0;
  let grandCost = 0;

  groups.forEach(g => {
    grandRuns += g.count;
    grandInput += g.inputTokens;
    grandOutput += g.outputTokens;
    grandTotalTokens += g.totalTokens;
    grandCost += g.totalCost;

    table.push([
      g.groupKey,
      g.count,
      formatTokens(g.inputTokens),
      formatTokens(g.outputTokens),
      formatTokens(g.totalTokens),
      chalk.green(formatCurrency(g.totalCost)),
    ]);
  });

  // Divider row
  table.push([
    chalk.bold('TOTAL'),
    chalk.bold(grandRuns),
    chalk.bold(formatTokens(grandInput)),
    chalk.bold(formatTokens(grandOutput)),
    chalk.bold(formatTokens(grandTotalTokens)),
    chalk.bold(chalk.green(formatCurrency(grandCost))),
  ]);

  return table.toString();
}
