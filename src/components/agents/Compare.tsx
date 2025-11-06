"use client";

import React from "react";
import models from "@/data/agentModels.json";
import { useAgentSession } from "./AgentSessionContext";

export default function Compare() {
  const sessionContext = useAgentSession();
  const session = "state" in sessionContext ? sessionContext.state : sessionContext;

  if (!models || !Array.isArray(models)) {
    return (
      <section id="compare" className="py-10">
        <h2 className="text-xl font-semibold text-white">Model comparison</h2>
        <p className="text-sm text-slate-300 mt-2">
          Models data could not be loaded.
        </p>
      </section>
    );
  }

  const baseModel =
    models.find((m: any) => m.model_name === session.modelName) || models[0];

  return (
    <section id="compare" className="py-10">
      <h2 className="text-xl font-semibold text-white">Model comparison</h2>
      <p className="text-sm text-slate-300 mt-2">
        You are using {baseModel.model_name} from {baseModel.provider}.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.slice(0, 6).map((m: any) => {
          const inputCost = m.input_price_per_1k_tokens_usd;
          const outputCost = m.output_price_per_1k_tokens_usd;
          const context = m.max_context_window_tokens;
          const compression = m.token_compression_efficiency;
          return (
            <div
              key={m.model_name}
              className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
            >
              <h3 className="text-base font-medium text-white">{m.model_name}</h3>
              <p className="text-xs text-slate-400 mt-1">{m.provider}</p>
              <p className="text-xs text-slate-400 mt-1">
                Input 1k ${inputCost} Output 1k ${outputCost}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Context {context} tokens
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Compression {compression}
              </p>
              <p className="text-xs text-slate-200 mt-3">
                Ideal for {m.rated_tasks}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
