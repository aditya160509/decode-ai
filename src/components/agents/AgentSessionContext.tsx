'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export type AgentSessionState = {
  modelName: string;
  personalityId: string;
  promptDomainId: string;
  memoryMode: 'Off' | 'Short' | 'Long';
  toolMix: string[];
  complexityLevel: number;
  compressionOverride: number;
  userLoadProfile: 'single' | 'classroom_30' | 'team_120' | 'org_500';
  costCeilingUSD: number;
  region?: 'us' | 'eu' | 'asia';
  cacheHitRate?: number;
  retrievalDepth?: number;
  availabilityTier?: 'standard' | 'high' | 'burst';
};

const defaultSession: AgentSessionState = {
  modelName: 'GPT 5 (medium)',
  personalityId: 'analytical',
  promptDomainId: 'classroom',
  memoryMode: 'Off',
  toolMix: [],
  complexityLevel: 2,
  compressionOverride: 1.0,
  userLoadProfile: 'single',
  costCeilingUSD: 50,
  region: 'us',
  cacheHitRate: 0.0,
  retrievalDepth: 1,
  availabilityTier: 'standard'
};

type AgentSessionContextValue = {
  state: AgentSessionState;
  setState: React.Dispatch<React.SetStateAction<AgentSessionState>>;
};

const AgentSessionContext = createContext<AgentSessionContextValue | undefined>(undefined);

type AgentSessionProviderProps = {
  children: React.ReactNode;
  initialState?: AgentSessionState;
};

export function AgentSessionProvider({ children, initialState }: AgentSessionProviderProps) {
  const [state, setState] = useState<AgentSessionState>(initialState ?? defaultSession);

  const value = useMemo(() => ({ state, setState }), [state]);

  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>;
}

export function useAgentSession() {
  const ctx = useContext(AgentSessionContext);
  if (!ctx) {
    throw new Error('useAgentSession must be used within an AgentSessionProvider');
  }
  return ctx;
}

export { defaultSession };
