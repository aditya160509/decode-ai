import personalitiesData from "../../data/personalities.json";

export type PersonalityDefinition = {
  tone: string;
  verbs: string[];
  color: string;
  reasoningMultiplier: number;
  creativityBias: number;
};

const PERSONALITIES = personalitiesData as Record<string, PersonalityDefinition>;

const FALLBACK_PERSONALITY: PersonalityDefinition = {
  tone: "neutral",
  verbs: ["plan", "act", "observe", "report"],
  color: "gray",
  reasoningMultiplier: 1.0,
  creativityBias: 1.0
};

export function getPersonality(personalityId: string): PersonalityDefinition {
  return PERSONALITIES[personalityId] ?? FALLBACK_PERSONALITY;
}

export function listPersonalityIds(): string[] {
  return Object.keys(PERSONALITIES);
}
