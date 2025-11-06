"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pushConsole, readHome } from "@/lib/decodeai-storage";
import { EngagePanel } from "@/features/console/EngagePanelLeft";

type Entry = { role: "user" | "sys"; text: string };

export function ConsoleOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const [log, setLog] = useState<Entry[]>([]);
  const [cmd, setCmd] = useState("");
  const [engageOpen, setEngageOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readHome().consoleHistory;
    if (saved.length) {
      setLog(saved.map((text) => ({ role: "sys" as const, text })));
    }

    const greetId = window.setTimeout(() => {
      setLog((prev) => [
        ...prev,
        { role: "sys", text: "hello. welcome to decodeAI." },
        { role: "sys", text: "type 'help' for available commands." },
      ]);
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(greetId);
    };
  }, [onClose]);

  function say(text: string) {
    setLog((prev) => [...prev, { role: "sys", text }]);
    pushConsole(text);
  }

  function openRoute(path: string) {
    try {
      navigate(path);
      say(`→ opening ${path}`);
      (window as any).__decodeai_setRouteStatus?.("ok");
    } catch {
      say(`→ route ${path} not found`);
      (window as any).__decodeai_setRouteStatus?.("not found");
    }
  }

  function run(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setLog((prev) => [...prev, { role: "user", text: raw }]);

    const key = trimmed.toLowerCase();

    if (key === "help") {
      say("help              show available commands");
      say("launch github     open the GitHub track");
      say("launch ai         open the AI Concepts track");
      say("launch nocode     open the No Code Toolkit");
      say("launch eduprompt  open the EduPrompt track");
      say("engage ai         open the local study assistant");
      say("history           print recent console lines");
      say("clear             clear console log view");
      say("about             describe the lab purpose");
      return;
    }

    if (key === "about") {
      say("DecodeAI is a student built learning lab.");
      say("You learn GitHub, AI concepts, no code shipping, and prompt clarity.");
      say("Goal: build something real, explain it, and ship it.");
      return;
    }

    if (key === "launch github") return openRoute("/github");
    if (key === "launch ai") return openRoute("/ai");
    if (key === "launch nocode") return openRoute("/nocode");
    if (key === "launch eduprompt") return openRoute("/eduprompt");

    if (key === "engage ai") {
      setEngageOpen(true);
      say("initializing AI assist module...");
      say("ready for queries");
      return;
    }

    if (key === "history") {
      const saved = readHome().consoleHistory;
      if (!saved.length) {
        say("no history");
        return;
      }
      saved.slice(-12).forEach((line) => say(line));
      return;
    }

    if (key === "clear") {
      setLog([]);
      say("screen cleared");
      return;
    }

    say('command not found. type "help" to list commands.');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DecodeAI command console"
      className="fixed inset-0 z-50 bg-black/60 grid place-items-center"
    >
      <div className="card w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shadow-[var(--shadow-orb)]" style={{ background: "var(--focus)" }} />
            <span className="text-sm text-[var(--muted)]">decodeAI console</span>
          </div>
          <button type="button" aria-label="Close console" onClick={onClose} className="focus-ring p-2 rounded-md">
            <X />
          </button>
        </div>

        <div className="h-80 overflow-auto px-4 py-3 space-y-2">
          {log.map((entry, index) => (
            <div key={`log-${index}`} className={entry.role === "user" ? "text-[var(--accent-github)]" : ""}>
              <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                {entry.role === "user" ? `user@decodeai:~$ ${entry.text}` : entry.text}
              </pre>
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(cmd);
            setCmd("");
          }}
          className="flex items-center gap-2 px-4 pb-4"
        >
          <span className="font-mono text-sm text-[var(--muted)]">user@decodeai:~$</span>
          <input
            ref={inputRef}
            value={cmd}
            onChange={(event) => setCmd(event.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-sm focus-ring rounded px-2 py-1"
            placeholder="type a command"
          />
        </form>
      </div>

      {engageOpen && <EngagePanel onClose={() => setEngageOpen(false)} />}
    </div>
  );
}
