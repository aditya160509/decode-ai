const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

type ObjectivePatterns = RegExp[][];

export const OBJECTIVE_MATCHERS: Record<string, ObjectivePatterns> = {
  rebase_practice: [
    [/^git rebase(?: origin)? main$/i],
    [/^git rebase --continue$/i],
    [/^git log --oneline(?: -n \d+)?$/i],
  ],
  undo_commit: [
    [/^git reset --soft head(?:\^|~1)$/i],
    [/^git commit --amend(?=\s|$).*$/i],
    [/^git log --oneline(?: -n \d+)?$/i],
  ],
};

export const normaliseCommand = (value: string) => normalize(value);
