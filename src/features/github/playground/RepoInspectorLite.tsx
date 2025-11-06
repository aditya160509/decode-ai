import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RepoState } from './types';

interface RepoInspectorLiteProps {
  repo: RepoState;
  className?: string;
}

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};

export const RepoInspectorLite = ({ repo, className }: RepoInspectorLiteProps) => {
  const files = Object.keys(repo.files).sort((a, b) => a.localeCompare(b));
  const branches = [...repo.branches].sort((a, b) => a.localeCompare(b));
  const commits = [...repo.commits].reverse();
  const tags = repo.tags;

  return (
    <Card className={cn('glass-card glass-hover flex h-full flex-col gap-4 p-4 text-xs leading-5', className)}>
      <h3 className="font-display text-lg text-primary">Repo Inspector</h3>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Files</h4>
        <ul className="space-y-1 rounded-md border border-border/40 bg-background/60 p-3 text-muted-foreground">
          {files.length === 0 && <li>No files present.</li>}
          {files.map((file) => (
            <li key={file} className="flex items-center justify-between gap-2">
              <span className="truncate">{file}</span>
              {repo.staged.includes(file) && <Badge variant="outline">staged</Badge>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Branches</h4>
        <ul className="space-y-1 rounded-md border border-border/40 bg-background/60 p-3 text-muted-foreground">
          {branches.map((branch) => (
            <li key={branch} className="flex items-center justify-between gap-2">
              <span>{branch}</span>
              {branch === repo.currentBranch ? <Badge variant="secondary">current</Badge> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex-1">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Commits</h4>
        <div className="h-full rounded-md border border-border/40 bg-background/60 p-3 text-muted-foreground">
          {commits.length === 0 && <p>No commits yet.</p>}
          {commits.map((commit) => (
            <article key={commit.id} className="mb-3 border-b border-border/30 pb-2 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">{commit.msg}</p>
              <p className="text-[11px]">
                {commit.id} · {commit.branch} {commit.timestamp ? `· ${formatTimestamp(commit.timestamp)}` : ''}
              </p>
            </article>
          ))}
        </div>
      </section>

      {tags.length > 0 && (
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tags</h4>
          <ul className="space-y-1 rounded-md border border-border/40 bg-background/60 p-3 text-muted-foreground">
            {tags.map((tag) => (
              <li key={tag.name} className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{tag.name}</span>
                <span className="text-[11px]">{formatTimestamp(tag.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
};

export default RepoInspectorLite;
