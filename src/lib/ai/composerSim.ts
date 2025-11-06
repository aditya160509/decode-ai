import toolsData from "../../data/agentTools.json";
import { approximateTokens } from "./tokens";

export type Block = { id?: string; type: string; config: Record<string, unknown>; };

type ComposerSimulationOptions = {
  domainOutputFactor?: number;
  memoryMode?: "Off" | "Short" | "Long";
  retrievalDepth?: number;
  toolMixWeight?: number;
};

type ToolDefinition = {
  id: string;
  name: string;
  category: string;
};

const TOOL_MAP = new Map<string, ToolDefinition>(
  (toolsData as ToolDefinition[]).map((tool) => [tool.id.toLowerCase(), tool])
);

function getToolCategory(toolId: string): string | undefined {
  const key = toolId.toLowerCase();
  const tool = TOOL_MAP.get(key);
  if (tool) return tool.category;
  for (const entry of TOOL_MAP.values()) {
    if (entry.name.toLowerCase() === key) return entry.category;
  }
  return undefined;
}

function determineMemoryMode(blocks: Block[], fallback: ComposerSimulationOptions["memoryMode"]) {
  const memoryBlock = blocks.find((block) => block.type === "memory");
  if (!memoryBlock) return fallback ?? "Off";
  const length = (memoryBlock.config?.length ?? "short").toString().toLowerCase();
  if (length === "long") return "Long";
  if (length === "short") return "Short";
  return "Off";
}

function collectToolIds(blocks: Block[]): string[] {
  return blocks
    .filter((block) => block.type === "tool")
    .map((block) => {
      const id = (block.config?.id ?? "").toString();
      if (id) return id;
      const typeName = (block.config?.tool_type ?? block.type).toString();
      return typeName;
    })
    .filter(Boolean);
}

export function simulateComposerRun(
  blocks: Block[],
  prompt: string,
  options: ComposerSimulationOptions = {}
) {
  const domainOutputFactor = options.domainOutputFactor ?? 1;
  const retrievalDepth = options.retrievalDepth ?? 1;
  const toolMixWeight = options.toolMixWeight ?? 0;
  const memoryMode = determineMemoryMode(blocks, options.memoryMode);

  const toolIds = collectToolIds(blocks);

  const steps: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "goal":
        steps.push("Clarify the goal from the provided prompt.");
        break;
      case "planner":
        steps.push("Design a plan that sequences future tool and memory steps.");
        break;
      case "tool":
        steps.push("Invoke the configured tool and note the observation.");
        break;
      case "memory":
        steps.push("Inject stored memory to maintain continuity.");
        break;
      case "reflect":
        steps.push("Reflect on the outcome and adjust the plan once.");
        break;
      case "output":
        steps.push("Compose the final output for the learner.");
        break;
      case "branch":
        steps.push("Evaluate branch conditions to select the next path.");
        break;
      case "guard":
        steps.push("Check guardrails to ensure safe handling.");
        break;
      case "summary":
        steps.push("Summarize key findings before finishing.");
        break;
      default:
        steps.push("Process the block and continue the workflow.");
        break;
    }
  }
  if (steps.length === 0) {
    steps.push("Clarify the goal from the provided prompt.");
    steps.push("Compose the final output for the learner.");
  }

  const inputTokens = approximateTokens(prompt);
  const outputTokens = Math.max(256, Math.round(inputTokens * 0.75 * domainOutputFactor));

  let memoryTokens = memoryMode === "Short" ? 200 : memoryMode === "Long" ? 1000 : 0;

  let toolOverhead = 0;
  for (const toolId of toolIds) {
    const category = getToolCategory(toolId);
    const base =
      category && /dev|vision/i.test(category) ? 120 : /code|vision/i.test(toolId) ? 120 : 50;
    toolOverhead += base;
  }
  toolOverhead = Math.round(
    toolOverhead * (1 + (retrievalDepth - 1) * 0.15) * (1 + toolMixWeight * 0.1)
  );

  const totalTokens = inputTokens + outputTokens + memoryTokens + toolOverhead;
  const runtime = Number((totalTokens / 55).toFixed(1));

  return {
    steps,
    tokens: totalTokens,
    runtime,
    breakdown: {
      inputTokens,
      outputTokens,
      memoryTokens,
      toolOverhead
    },
    output: `Synthesized result for ${prompt}`
  };
}
