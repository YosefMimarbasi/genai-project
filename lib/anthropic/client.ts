import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";

export function createAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
}
