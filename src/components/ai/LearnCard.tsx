import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LearnCardProps {
  sectionId: string;
  slug: string;
  title: string;
  tag?: string;
  description?: string;
  children?: ReactNode;
  learned?: boolean;
  onToggle?: (sectionId: string, slug: string, nextValue: boolean) => void;
  className?: string;
}

export const LearnCard = ({
  sectionId,
  slug,
  title,
  tag,
  description,
  children,
  learned = false,
  onToggle,
  className,
}: LearnCardProps) => {
  const handleToggle = (value: boolean | string) => {
    const next = value === true;
    onToggle?.(sectionId, slug, next);
  };

  return (
    <Card className={cn("flex flex-col h-full glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold leading-tight">{title}</CardTitle>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            {tag ? <Badge variant="outline">{tag}</Badge> : null}
            {onToggle ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={learned}
                  onCheckedChange={handleToggle}
                  aria-label={`Mark ${title} as learned`}
                />
                <span>Learned</span>
              </label>
            ) : null}
          </div>
        </div>
      </CardHeader>
      {children ? <CardContent className="space-y-4 flex-1">{children}</CardContent> : null}
    </Card>
  );
};
