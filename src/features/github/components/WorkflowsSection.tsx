import type { WorkflowCard } from '@/types/github';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

interface WorkflowsSectionProps {
  workflows: WorkflowCard[];
  onPractice?: (scenarioId: string) => void;
}

const workflowScenarioMap: Record<string, string> = {
  'Solo Developer Flow': 'branch-merge',
  'Small-Team Feature Branching': 'branch-merge',
  'Open-Source Contribution Flow': 'branch-merge',
  'Company Gitflow Model': 'resolve-conflict',
  'Continuous Integration (CI/CD) Workflow': 'branch-merge',
  'Documentation-First Workflow': 'stash-changes',
};

export const WorkflowsSection = ({ workflows, onPractice }: WorkflowsSectionProps) => (
  <section id="workflows" className="scroll-mt-28 space-y-6">
    <header className="space-y-2">
      <h2 className="font-display text-3xl font-semibold">Workflows</h2>
      <p className="text-muted-foreground">Explore how different teams use GitHub, from solo work to CI/CD pipelines.</p>
    </header>
    <div className="grid gap-4 lg:grid-cols-2">
      {workflows.map((workflow) => {
        const scenario = workflowScenarioMap[workflow.name];
        return (
          <Card key={workflow.name} className="glass-card glass-hover p-6 space-y-3">
            <h3 className="font-display text-xl text-primary">{workflow.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{workflow.description}</p>
            {scenario && onPractice && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => onPractice(scenario)}
              >
                <Rocket className="h-4 w-4" />
                Practice this flow
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  </section>
);
