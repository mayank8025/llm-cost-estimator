import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pricingPath = path.join(__dirname, '../src/pricing/pricing-data.json');

if (!fs.existsSync(pricingPath)) {
  console.error(`Error: Pricing data file not found at ${pricingPath}`);
  process.exit(1);
}

const pricing = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

console.log(`\n=== Pricing Verification ===`);
console.log(`Local Pricing Version: ${pricing.version}`);
console.log(`Currency: ${pricing.currency}`);
console.log(`Models Tracked: ${Object.keys(pricing.models).length}`);

// Calculate version age
const versionDate = new Date(pricing.version);
const now = new Date();
const timeDiff = now.getTime() - versionDate.getTime();
const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

if (isNaN(daysDiff)) {
  console.warn(`\x1b[33mWarning: Pricing version is not a valid date format. Please check the version key.\x1b[0m`);
} else if (daysDiff > 30) {
  console.warn(`\x1b[33mWarning: Pricing version is ${daysDiff} days old (greater than 30 days!). Please update pricing rates.\x1b[0m`);
} else {
  console.log(`\x1b[32mSuccess: Pricing version is fresh (${daysDiff} days old).\x1b[0m`);
}

console.log(`\nVerify prices manually from official sources:`);
console.log(`1. OpenAI: https://openai.com/api/pricing/`);
console.log(`2. Anthropic: https://www.anthropic.com/pricing`);
console.log(`3. Google Gemini: https://aistudio.google.com/pricing`);
console.log(`============================\n`);
