export interface Commit {
  id: string;
  msg: string;
  branch: string;
  timestamp?: number;
}

export interface Tag {
  name: string;
  message: string;
  createdAt: number;
}

export interface RepoState {
  branches: string[];
  currentBranch: string;
  files: Record<string, string>;
  staged: string[];
  commits: Commit[];
  tags: Tag[];
  stash: Array<{ id: string; files: Record<string, string>; branch: string }>;
  pendingConflict?: boolean;
  rebaseState?: 'pending' | null;
}

export interface Scenario {
  id: string;
  title: string;
  goal: string;
  sandbox: boolean;
  initialRepo: Partial<RepoState> & {
    branches: string[];
    currentBranch: string;
    files: Record<string, string>;
    staged?: string[];
    commits?: Commit[];
  };
  objectives: string[];
  solution: string[];
  hints: string[];
}
