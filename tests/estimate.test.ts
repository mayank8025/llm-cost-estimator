import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { estimateCost, estimateTokens } from '../src/core/estimate';
import { compareModels } from '../src/core/compare';
import { logUsage, getUsageSummary, getUsageLogPath, readUsageRecords } from '../src/core/usage-log';
import { loadPricing, getOverrideFilePath } from '../src/pricing/pricing-loader';

describe('Core Estimation Math', () => {
  it('should estimate cost correctly for openai/gpt-4o', () => {
    // Input: "hello world" -> 2 tokens
    // Rate: inputPer1M = 2.50, outputPer1M = 10.00
    // Expected cost: 2 * 2.5 / 1,000,000 = 0.000005
    // Output: 100 tokens
    // Expected output cost: 100 * 10 / 1,000,000 = 0.001
    const result = estimateCost({
      provider: 'openai',
      model: 'gpt-4o',
      input: 'hello world',
      expectedOutputTokens: 100
    });

    expect(result.inputTokens).toBe(2);
    expect(result.outputTokens).toBe(100);
    expect(result.inputCost).toBeCloseTo(0.000005, 8);
    expect(result.outputCost).toBeCloseTo(0.001, 6);
    expect(result.totalCost).toBeCloseTo(0.001005, 8);
    expect(result.estimated).toBe(false);
  });

  it('should throw error for unknown models', () => {
    expect(() => {
      estimateCost({
        provider: 'openai',
        model: 'non-existent-model',
        input: 'hello'
      });
    }).toThrow(/not found for provider/);
  });
});

describe('Model Comparison', () => {
  it('should compare models and return them sorted cheapest first', () => {
    // openai/gpt-4o-mini: inputPer1M = 0.15, outputPer1M = 0.60
    // openai/gpt-4o: inputPer1M = 2.50, outputPer1M = 10.00
    // gemini/gemini-1.5-pro: inputPer1M = 1.25, outputPer1M = 5.00
    const results = compareModels({
      input: 'hello world',
      expectedOutputTokens: 100,
      candidates: [
        { provider: 'openai', model: 'gpt-4o' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'gemini', model: 'gemini-1.5-pro' }
      ]
    });

    expect(results.length).toBe(3);
    // Cheapest should be gpt-4o-mini
    expect(results[0].model).toBe('gpt-4o-mini');
    // Middle should be gemini-1.5-pro
    expect(results[1].model).toBe('gemini-1.5-pro');
    // Most expensive should be gpt-4o
    expect(results[2].model).toBe('gpt-4o');
  });
});

describe('Pricing Overrides', () => {
  const tempOverridePath = path.join(os.tmpdir(), 'pricing-override-test.json');

  afterEach(() => {
    if (fs.existsSync(tempOverridePath)) {
      fs.unlinkSync(tempOverridePath);
    }
    delete process.env.LLM_COST_PRICING_OVERRIDE;
  });

  it('should apply pricing overrides via environment variable', () => {
    const customPricing = {
      models: {
        'openai/gpt-4o': { inputPer1M: 99.00, outputPer1M: 99.00 }
      }
    };
    fs.writeFileSync(tempOverridePath, JSON.stringify(customPricing), 'utf8');
    process.env.LLM_COST_PRICING_OVERRIDE = tempOverridePath;

    const { data } = loadPricing();
    expect(data.models['openai/gpt-4o'].inputPer1M).toBe(99.00);
    expect(data.models['openai/gpt-4o'].outputPer1M).toBe(99.00);

    // Other models should remain unchanged
    expect(data.models['openai/gpt-4o-mini'].inputPer1M).toBe(0.15);
  });
});

describe('Usage Log Operations', () => {
  const tempLogPath = path.join(os.tmpdir(), 'usage-log-test.jsonl');

  beforeEach(() => {
    if (fs.existsSync(tempLogPath)) {
      fs.unlinkSync(tempLogPath);
    }
    process.env.LLM_COST_LOG_PATH = tempLogPath;
  });

  afterEach(() => {
    if (fs.existsSync(tempLogPath)) {
      fs.unlinkSync(tempLogPath);
    }
    delete process.env.LLM_COST_LOG_PATH;
  });

  it('should log and aggregate usage correctly', () => {
    logUsage({
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 1000,
      outputTokens: 2000,
      tag: 'test-tag'
    });

    logUsage({
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 500,
      outputTokens: 500,
      tag: 'test-tag'
    });

    const records = readUsageRecords();
    expect(records.length).toBe(2);
    expect(records[0].inputTokens).toBe(1000);
    expect(records[1].outputTokens).toBe(500);

    const summary = getUsageSummary({ groupBy: 'model' });
    const modelGroup = summary.find(g => g.groupKey === 'openai/gpt-4o');
    expect(modelGroup).toBeDefined();
    expect(modelGroup?.inputTokens).toBe(1500);
    expect(modelGroup?.outputTokens).toBe(2500);
    expect(modelGroup?.count).toBe(2);
    
    // totalCost calculation:
    // 1500 * 2.50 / 1M = 0.00375
    // 2500 * 10.00 / 1M = 0.025
    // total = 0.02875
    expect(modelGroup?.totalCost).toBeCloseTo(0.02875, 5);
  });
});
