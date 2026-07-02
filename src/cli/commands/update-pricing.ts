import chalk from 'chalk';
import { loadPricing } from '../../pricing/pricing-loader.js';

export function handleUpdatePricing(): void {
  console.log(chalk.cyan('Checking for updated pricing rates...'));

  try {
    const { data } = loadPricing();
    const versionDate = new Date(data.version);
    const now = new Date();
    const timeDiff = now.getTime() - versionDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    console.log(chalk.green(`\nSuccess: Pricing data loaded successfully.`));
    console.log(`  Current Version: ${data.version}`);
    console.log(`  Currency:        ${data.currency}`);
    console.log(`  Models Tracked:  ${Object.keys(data.models).length}`);

    if (isNaN(daysDiff)) {
      console.log(chalk.yellow(`  Status: Custom version format. Rates are up to date.`));
    } else if (daysDiff > 30) {
      console.log(chalk.yellow(`  Status: Pricing is ${daysDiff} days old. You can override individual rates by creating a JSON file at ~/.llm-cost-estimator/pricing-override.json`));
    } else {
      console.log(chalk.green(`  Status: Rates are up to date (${daysDiff} days old).`));
    }
  } catch (err) {
    console.error(chalk.red(`Error updating pricing: ${(err as Error).message}`));
    process.exit(1);
  }
}
