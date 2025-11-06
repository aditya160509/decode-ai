import type { Dispatch, SetStateAction } from 'react';
import type { RepoState } from './types';

interface CommandHelpers {
  completeObjective: (command: string) => void;
  advanceGuidedStep: () => void;
  guidedMode: boolean;
  activeScenarioId: string;
  currentStepExpectations?: string[];
  markStateChanged: () => void;
}

type AppendLog = (line: string | string[]) => void;

const cloneRepo = (repo: RepoState): RepoState => ({
  branches: [...repo.branches],
  currentBranch: repo.currentBranch,
  files: { ...repo.files },
  staged: [...repo.staged],
  commits: repo.commits.map((commit) => ({ ...commit })),
  tags: repo.tags.map((tag) => ({ ...tag })),
  stash: repo.stash.map((entry) => ({ ...entry, files: { ...entry.files } })),
  pendingConflict: repo.pendingConflict,
  rebaseState: repo.rebaseState ?? null,
});

const createCommitId = () => `c${Math.random().toString(16).slice(2, 7)}`;

const normalizeMessage = (tokens: string[], flag: string) => {
  const index = tokens.indexOf(flag);
  if (index === -1 || !tokens[index + 1]) return null;
  const message = tokens.slice(index + 1).join(' ').replace(/^["']|["']$/g, '');
  return message || null;
};

const ensureBranchExists = (repo: RepoState, branch: string) => {
  if (!repo.branches.includes(branch)) {
    repo.branches.push(branch);
  }
};

const print = (appendLog: AppendLog, lines: string | string[]) => {
  appendLog(lines);
};

const handleGuidedProgress = (helpers: CommandHelpers, command: string) => {
  if (!helpers.guidedMode || !helpers.currentStepExpectations?.length) {
    return;
  }
  const matches = helpers.currentStepExpectations.some((expected) => command.startsWith(expected));
  if (matches) {
    helpers.advanceGuidedStep();
  }
};

export const runCommand = (
  input: string,
  repo: RepoState,
  setRepo: Dispatch<SetStateAction<RepoState>>,
  appendLog: AppendLog,
  helpers: CommandHelpers
) => {
  const trimmed = input.trim();
  if (!trimmed) return;

  const tokens = trimmed.split(/\s+/);
  if (tokens[0] !== 'git') {
    print(appendLog, `${tokens[0]}: command not found`);
    return;
  }

  const subcommand = tokens[1];
  const applyUpdate = (updater: (draft: RepoState) => void) => {
    setRepo((prev) => {
      const draft = cloneRepo(prev);
      updater(draft);
      helpers.markStateChanged();
      return draft;
    });
  };

  switch (subcommand) {
    case 'status': {
      const staged = repo.staged;
      const lines = [
        `On branch ${repo.currentBranch}`,
        staged.length === 0 ? 'Nothing to commit, working tree clean.' : 'Changes staged for commit:',
      ];
      if (staged.length > 0) {
        staged.forEach((file) => lines.push(`  staged: ${file}`));
      }
      if (repo.pendingConflict) {
        lines.push('You still have conflicts to resolve.');
      }
      print(appendLog, lines);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'add': {
      const target = tokens[2];
      if (!target) {
        print(appendLog, 'git add: missing pathspec');
        break;
      }
      const addFile = (filepath: string) => {
        if (!repo.files[filepath]) {
          print(appendLog, `git add: ${filepath}: No such file`);
          return;
        }
        applyUpdate((draft) => {
          if (!draft.staged.includes(filepath)) {
            draft.staged.push(filepath);
          }
          if (draft.pendingConflict && filepath === 'src/App.tsx') {
            draft.pendingConflict = false;
          }
        });
        print(appendLog, `Added ${filepath} to staging area.`);
      };

      if (target === '.') {
        Object.keys(repo.files).forEach((file) => {
          applyUpdate((draft) => {
            if (!draft.staged.includes(file)) {
              draft.staged.push(file);
            }
          });
        });
        print(appendLog, 'Staged all tracked files.');
      } else {
        addFile(target);
      }
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'commit': {
      const isAmend = tokens.includes('--amend');
      const message = normalizeMessage(tokens, '-m');
      if (isAmend) {
        if (!message) {
          print(appendLog, 'git commit --amend: provide a message with -m "message"');
          break;
        }
        if (repo.commits.length === 0) {
          print(appendLog, 'git commit --amend: no commits to amend.');
          break;
        }
        applyUpdate((draft) => {
          const lastIndex = draft.commits.length - 1;
          if (lastIndex >= 0) {
            draft.commits[lastIndex] = {
              ...draft.commits[lastIndex],
              msg: message,
              timestamp: Date.now(),
            };
          }
          draft.staged = [];
          draft.pendingConflict = false;
        });
        print(appendLog, [
          `[${repo.currentBranch}] ${message} (amended)`,
          'Updated previous commit message.',
        ]);
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      if (!message) {
        print(appendLog, 'git commit: provide a message with -m "message"');
        break;
      }
      if (repo.staged.length === 0) {
        print(appendLog, 'git commit: nothing to commit');
        break;
      }
      applyUpdate((draft) => {
        const commit = {
          id: createCommitId(),
          msg: message,
          branch: draft.currentBranch,
          timestamp: Date.now(),
        };
        draft.commits.push(commit);
        draft.staged = [];
        draft.pendingConflict = false;
      });
      print(appendLog, [`[${repo.currentBranch}] ${message}`, '1 file changed (simulated).']);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'branch': {
      const target = tokens[2];
      if (!target) {
        const lines = repo.branches.map((branch) => {
          const marker = branch === repo.currentBranch ? '*' : ' ';
          return `${marker} ${branch}`;
        });
        print(appendLog, ['Existing branches:', ...lines]);
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      if (repo.branches.includes(target)) {
        print(appendLog, `Branch ${target} already exists.`);
      } else {
        applyUpdate((draft) => {
          draft.branches.push(target);
        });
        print(appendLog, `Created branch ${target}.`);
      }
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'checkout': {
      if (tokens[2] === '-b') {
        const newBranch = tokens[3];
        if (!newBranch) {
          print(appendLog, 'git checkout -b <branch>');
          break;
        }
        applyUpdate((draft) => {
          ensureBranchExists(draft, newBranch);
          draft.currentBranch = newBranch;
        });
        print(appendLog, `Switched to a new branch '${newBranch}'.`);
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      const branch = tokens[2];
      if (!branch) {
        print(appendLog, 'git checkout: specify a branch name');
        break;
      }
      if (!repo.branches.includes(branch)) {
        print(appendLog, `error: pathspec '${branch}' did not match any branch.`);
        break;
      }
      applyUpdate((draft) => {
        draft.currentBranch = branch;
      });
      print(appendLog, `Switched to branch '${branch}'.`);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'merge': {
      const branch = tokens[2];
      if (!branch) {
        print(appendLog, 'git merge: specify a branch to merge');
        break;
      }
      if (!repo.branches.includes(branch)) {
        print(appendLog, `fatal: ${branch} - branch not found.`);
        break;
      }
      if (branch === repo.currentBranch) {
        print(appendLog, 'Already up to date.');
        break;
      }
      if (repo.currentBranch === 'main' && branch === 'feature/conflict') {
        applyUpdate((draft) => {
          draft.pendingConflict = true;
        });
        print(appendLog, [
          'Auto-merging src/App.tsx',
          'CONFLICT (content): Merge conflict in src/App.tsx',
          'Fix conflicts and run git add src/App.tsx before committing.',
        ]);
      } else {
        applyUpdate((draft) => {
          ensureBranchExists(draft, branch);
        });
        print(appendLog, `Merged ${branch} into ${repo.currentBranch}.`);
      }
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'diff': {
      print(appendLog, [
        'diff --git a/file.txt b/file.txt',
        '--- a/file.txt',
        '+++ b/file.txt',
        '+ simulated change',
      ]);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'stash': {
      if (tokens[2] === 'pop') {
        if (repo.stash.length === 0) {
          print(appendLog, 'No stash entries to apply.');
          break;
        }
        applyUpdate((draft) => {
          draft.stash.pop();
        });
        print(appendLog, 'Restored latest stash entry and removed it from the stack.');
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      applyUpdate((draft) => {
        const id = `stash@{${draft.stash.length}}`;
        draft.stash.push({ id, files: { ...draft.files }, branch: draft.currentBranch });
        draft.staged = [];
      });
      print(appendLog, 'Saved working directory and index state (simulated).');
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'tag': {
      if (tokens[2] === '-a') {
        const name = tokens[3];
        const message = normalizeMessage(tokens, '-m') ?? 'tag';
        if (!name) {
          print(appendLog, 'git tag -a <name> -m "message"');
          break;
        }
        applyUpdate((draft) => {
          const existingIndex = draft.tags.findIndex((tag) => tag.name === name);
          const tag = { name, message, createdAt: Date.now() };
          if (existingIndex >= 0) {
            draft.tags[existingIndex] = tag;
          } else {
            draft.tags.push(tag);
          }
        });
        print(appendLog, `Annotated tag ${name} created.`);
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      print(appendLog, 'git tag: unsupported option in playground');
      break;
    }
    case 'show': {
      const target = tokens[2];
      if (!target) {
        print(appendLog, 'git show <ref>');
        break;
      }
      const tag = repo.tags.find((item) => item.name === target);
      if (!tag) {
        print(appendLog, `fatal: tag '${target}' not found`);
        break;
      }
      print(appendLog, [
        `tag ${tag.name}`,
        `Tagger: you@example.com`,
        `Date:   ${new Date(tag.createdAt).toLocaleString()}`,
        '',
        tag.message,
      ]);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    case 'log': {
      if (tokens[2] === '--oneline') {
        if (repo.commits.length === 0) {
          print(appendLog, 'No commits yet.');
        } else {
          const lines = [...repo.commits].reverse().map((commit) => `${commit.id} ${commit.msg}`);
          print(appendLog, lines);
        }
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      print(appendLog, 'Use git log --oneline for a concise view in this playground.');
      break;
    }
    case 'reset': {
      const mode = tokens[2];
      const targetRaw = tokens[3];
      if (mode === '--soft' && targetRaw && repo.commits.length > 0) {
        const target = targetRaw.toLowerCase();
        if (!/^head(~1|\^)$/.test(target)) {
          print(appendLog, 'git reset: only --soft HEAD~1 or HEAD^ is simulated.');
          break;
        }
        const last = repo.commits[repo.commits.length - 1];
        applyUpdate((draft) => {
          draft.commits = draft.commits.slice(0, -1);
          const staged = new Set([...draft.staged, ...Object.keys(draft.files)]);
          draft.staged = Array.from(staged);
        });
        print(appendLog, `Moved HEAD back. Previous commit "${last.msg}" is now staged.`);
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      print(appendLog, 'git reset: only --soft HEAD~1 or HEAD^ is simulated.');
      break;
    }
    case 'revert': {
      if (tokens[2] === 'HEAD') {
        applyUpdate((draft) => {
          const commit = {
            id: createCommitId(),
            msg: 'Revert last commit',
            branch: draft.currentBranch,
            timestamp: Date.now(),
          };
          draft.commits.push(commit);
        });
        print(appendLog, 'Created a new revert commit.');
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      print(appendLog, 'git revert: only HEAD is supported here.');
      break;
    }
    case 'rebase': {
      if (tokens[2] === '--continue') {
        if (repo.rebaseState !== 'pending') {
          print(appendLog, 'No rebase in progress.');
          break;
        }
        applyUpdate((draft) => {
          draft.rebaseState = null;
        });
        print(appendLog, 'Resolved conflicts and continued the rebase.');
        helpers.completeObjective(trimmed);
        handleGuidedProgress(helpers, trimmed);
        break;
      }
      const onto = tokens[2];
      if (!onto) {
        print(appendLog, 'git rebase <branch>');
        break;
      }
      if (!repo.branches.includes(onto)) {
        print(appendLog, `fatal: ${onto} - branch not found.`);
        break;
      }
      applyUpdate((draft) => {
        draft.rebaseState = 'pending';
      });
      print(appendLog, [
        `First, rewinding head to replay your work on top of ${onto}.`,
        'Resolve any conflicts, then run git rebase --continue.',
      ]);
      helpers.completeObjective(trimmed);
      handleGuidedProgress(helpers, trimmed);
      break;
    }
    default: {
      print(appendLog, `git: '${subcommand}' is not supported in this playground.`);
    }
  }
};
