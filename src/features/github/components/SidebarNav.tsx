import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarNavProps {
  sections: { id: string; label: string }[];
  activeSection: string | null;
  onNavigate: (id: string) => void;
}

export const SidebarNav = ({ sections, activeSection, onNavigate }: SidebarNavProps) => (
  <aside className="sticky top-24 h-[calc(100vh-6rem)] hidden lg:flex lg:w-56 xl:w-64">
    <div className="glass-card w-full p-4">
      <h2 className="font-display text-lg font-semibold mb-3 text-muted-foreground tracking-wide uppercase">Navigation</h2>
      <ScrollArea className="h-full">
        <nav aria-label="Section navigation" className="flex flex-col gap-1 pb-6">
          {sections.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  active
                    ? 'bg-primary/20 text-primary font-semibold shadow-inner'
                    : 'hover:bg-muted/30 text-muted-foreground'
                )}
                aria-current={active ? 'true' : 'false'}
              >
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  </aside>
);
