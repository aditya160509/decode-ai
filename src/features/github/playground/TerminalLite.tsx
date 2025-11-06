import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import explainMap from './data/git_explain.json';
import commandNotesMap from './data/git_command_notes.json';
import smartHintsMap from './data/git_smart_hints.json';

const EXPLAIN_MAP = explainMap as Record<string, string>;
const COMMAND_NOTES = commandNotesMap as Record<string, string>;
const SMART_HINTS = smartHintsMap as Record<
  string,
  { expected: string[]; commonMistakes: { wrong: string; hint: string }[] }
>;

const PROMPT = 'student@decodeai:~$';

interface ExplainState {
  cmd: string;
  text: string;
}

interface TerminalLiteProps {
  logs: string[];
  onCommand: (command: string) => void;
  disabled: boolean;
  onHistoryNavigate: (direction: 'prev' | 'next') => string;
  guidedMode: boolean;
  currentStepTitle?: string;
  activeScenarioId: string;
  onHint?: () => void;
  className?: string;
}

const findCommandNote = (command: string) => {
  const normalized = command.trim();
  let match = '';
  for (const key of Object.keys(COMMAND_NOTES)) {
    if (normalized.startsWith(key) && key.length > match.length) {
      match = key;
    }
  }
  return match ? COMMAND_NOTES[match] : '';
};

const findExplainText = (command: string) => {
  const normalized = command.trim();
  let match = '';
  for (const key of Object.keys(EXPLAIN_MAP)) {
    if (normalized.startsWith(key) && key.length > match.length) {
      match = key;
    }
  }
  return match ? EXPLAIN_MAP[match] : '';
};

const getSmartHint = (scenarioId: string, command: string): string => {
  const pack = SMART_HINTS[scenarioId];
  if (!pack) return '';

  const trimmed = command.trim();
  if (!trimmed) return '';

  for (const mistake of pack.commonMistakes) {
    if (trimmed === mistake.wrong || trimmed.startsWith(`${mistake.wrong} `)) {
      return mistake.hint;
    }
  }

  for (const expected of pack.expected) {
    if (trimmed === expected) {
      return '';
    }
    if (expected.startsWith(trimmed) && trimmed.length >= 3) {
      return `Almost there. Try ${expected}`;
    }
  }

  return '';
};

export const TerminalLite = ({
  logs,
  onCommand,
  disabled,
  onHistoryNavigate,
  guidedMode,
  currentStepTitle,
  activeScenarioId,
  onHint,
  className,
}: TerminalLiteProps) => {
  const [input, setInput] = useState('');
  const [explain, setExplain] = useState<ExplainState | null>(null);
  const [smartHint, setSmartHint] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  const commandLines = useMemo(() => logs.map((line) => line.startsWith(PROMPT)), [logs]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const hint = getSmartHint(activeScenarioId, trimmed);
    setSmartHint(hint);
    if (hint) {
      onHint?.();
    }

    onCommand(trimmed);
    setInput('');
    setExplain(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevCommand = onHistoryNavigate('prev');
      if (prevCommand !== undefined && prevCommand !== null) {
        setInput(prevCommand);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextCommand = onHistoryNavigate('next');
      if (nextCommand !== undefined && nextCommand !== null) {
        setInput(nextCommand);
      }
    }
  };

  return (
    <Card className={cn('glass-card glass-hover flex h-full flex-col p-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-primary">Terminal</h3>
        {guidedMode && currentStepTitle && (
          <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            Guided: {currentStepTitle}
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="mt-3 min-h-[520px] flex-1 overflow-y-auto rounded-md border border-border/40 bg-black/80 p-3 font-mono text-sm text-muted-foreground"
        aria-live="polite"
      >
        {logs.length === 0 && <pre>Welcome! Try typing `git status` to check the repository state.</pre>}
        {logs.map((line, index) => {
          const isCommandLine = commandLines[index];
          if (!isCommandLine) {
            return (
              <pre key={`${index}-${line}`} className="whitespace-pre-wrap">
                {line}
              </pre>
            );
          }
          const commandText = line.slice(PROMPT.length).trim();
          const explainText = findExplainText(commandText);
          const note = findCommandNote(commandText);
          const isExplainOpen = explain?.cmd === commandText && explain?.text === explainText;
          return (
            <div key={`${index}-${line}`} className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <pre className="flex-1 whitespace-pre-wrap" title={note || undefined}>
                  {line}
                </pre>
                {explainText && (
                  <button
                    type="button"
                    className="ml-2 rounded border border-primary/40 px-2 py-1 text-[11px] text-primary transition hover:bg-primary/10"
                    onClick={() =>
                      setExplain((prev) =>
                        prev && prev.cmd === commandText ? null : { cmd: commandText, text: explainText }
                      )
                    }
                  >
                    {isExplainOpen ? 'Close' : 'Explain'}
                  </button>
                )}
              </div>
              {isExplainOpen && (
                <div className="rounded-md border border-border/40 bg-background/80 p-3 text-xs text-foreground shadow-sm">
                  <div className="mb-1 font-medium">{commandText}</div>
                  <div>{explainText}</div>
                  <button
                    type="button"
                    className="mt-2 text-[11px] font-medium text-primary underline"
                    onClick={() => setExplain(null)}
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className="text-primary">{PROMPT}</span>
          <input
            ref={inputRef}
            value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setSmartHint('');
          }}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-md border border-border/40 bg-background/80 px-2 py-1 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Type a Git command"
            disabled={disabled}
            aria-label="Terminal command input"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            disabled={disabled}
          >
            Run
          </button>
        </div>
        {smartHint && (
          <p className="text-[11px] text-muted-foreground">{smartHint}</p>
        )}
      </form>
    </Card>
  );
};

export default TerminalLite;
