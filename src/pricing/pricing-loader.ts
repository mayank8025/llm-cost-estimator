import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import bundledPricing from './pricing-data.json' with { type: 'json' };

export const ModelPricingSchema = z.object({
  inputPer1M: z.number().nonnegative(),
  outputPer1M: z.number().nonnegative(),
});

export const PricingDataSchema = z.object({
  version: z.string(),
  currency: z.string().default('USD'),
  models: z.record(z.string(), ModelPricingSchema),
});

export type ModelPricing = z.infer<typeof ModelPricingSchema>;
export type PricingData = z.infer<typeof PricingDataSchema>;

// Validate bundled pricing at compile/runtime
const parsedBundled = PricingDataSchema.parse(bundledPricing);

/**
 * Gets the override file path from environment or default home directory.
 */
export function getOverrideFilePath(): string {
  if (process.env.LLM_COST_PRICING_OVERRIDE) {
    return path.resolve(process.env.LLM_COST_PRICING_OVERRIDE);
  }
  return path.join(os.homedir(), '.llm-cost-estimator', 'pricing-override.json');
}

/**
 * Loads the active pricing data, merging bundled rates with any user overrides.
 */
export function loadPricing(): { data: PricingData; source: 'bundled' | 'override' } {
  const overridePath = getOverrideFilePath();
  let activePricing: PricingData = { ...parsedBundled, models: { ...parsedBundled.models } };
  let source: 'bundled' | 'override' = 'bundled';

  try {
    if (fs.existsSync(overridePath)) {
      const content = fs.readFileSync(overridePath, 'utf8');
      const rawOverride = JSON.parse(content);

      // Validate override structure (can be partial)
      const OverrideSchema = z.object({
        version: z.string().optional(),
        currency: z.string().optional(),
        models: z.record(z.string(), ModelPricingSchema).optional(),
      });

      const parsedOverride = OverrideSchema.parse(rawOverride);

      if (parsedOverride.models) {
        activePricing.models = {
          ...activePricing.models,
          ...parsedOverride.models,
        };
        source = 'override';
      }
      if (parsedOverride.currency) {
        activePricing.currency = parsedOverride.currency;
      }
      if (parsedOverride.version) {
        activePricing.version = parsedOverride.version;
      }
    }
  } catch (err) {
    // If override file exists but fails validation, report warning/error but fallback
    console.warn(`Warning: Failed to load pricing override from ${overridePath}. Using bundled rates. Error: ${(err as Error).message}`);
  }

  return { data: activePricing, source };
}
