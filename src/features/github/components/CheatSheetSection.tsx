import { useMemo, useRef, useState } from 'react';
import type { CheatCluster } from '@/types/github';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface CheatSheetSectionProps {
  header: string;
  clusters: CheatCluster[];
}

export const CheatSheetSection = ({ header, clusters }: CheatSheetSectionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const allExpanded = useMemo(() => clusters.length > 0 && clusters.every((cluster) => expanded[cluster.title]), [clusters, expanded]);

  const handleToggleAll = (value: boolean) => {
    const next: Record<string, boolean> = {};
    clusters.forEach((cluster) => { next[cluster.title] = value; });
    setExpanded(next);
  };

  const handleToggle = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0f1729',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const marginX = (pageWidth - imgWidth) / 2;
      const marginY = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight);
      pdf.save('decodeai-github-cheatsheet.pdf');
      toast.success('Cheat sheet PDF downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Could not generate PDF');
    }
  };

  return (
    <section id="cheatsheet" className="scroll-mt-28 space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-semibold">Cheat Sheet</h2>
        <p className="text-muted-foreground">{header}</p>
      </header>
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Switch id="toggle-all" checked={allExpanded} onCheckedChange={handleToggleAll} />
            <Label htmlFor="toggle-all" className="text-sm text-muted-foreground">Expand/Collapse all</Label>
          </div>
          <Button type="button" onClick={handleDownload} className="gap-2" variant="secondary">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
        <div ref={containerRef} className="grid gap-4 md:grid-cols-2">
          {clusters.map((cluster) => {
            const isOpen = expanded[cluster.title];
            return (
              <div key={cluster.title} className="rounded-lg border border-border/30 bg-background/60 p-4">
                <button
                  type="button"
                  onClick={() => handleToggle(cluster.title)}
                  className="flex w-full items-center justify-between text-left font-display text-lg text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-expanded={isOpen}
                >
                  <span>{cluster.title}</span>
                  <span className="text-sm text-muted-foreground">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <ul className="mt-3 space-y-1 rounded-md bg-muted/20 p-3 font-mono text-xs text-muted-foreground">
                    {cluster.commands.map((command) => (
                      <li key={command}>{command}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
