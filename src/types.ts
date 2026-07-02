export type Provider = "openai" | "anthropic" | "gemini";

export interface ChatMessage {
  role: string;
  content: string;
}

export type InputText = string | ChatMessage[];

export interface EstimateInput {
  provider: Provider;
  model: string;
  input: InputText;
  expectedOutputTokens?: number;
}

export interface EstimateResult {
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  pricingSource: "bundled" | "override" | "remote";
  estimated: boolean; // true if tokenizer is approximate
}

export interface UsageRecord {
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: number;
  tag?: string;
}

export interface ProviderAdapter {
  id: Provider;
  countTokens(input: InputText, model?: string): number;
  isEstimated: boolean;
  listModels(): string[];
}
