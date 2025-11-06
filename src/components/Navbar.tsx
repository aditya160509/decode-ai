import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Search } from 'lucide-react';
import { useGlobalSearch } from '@/contexts/global-search';

export const Navbar = () => {
  const { openSearch } = useGlobalSearch();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Code2 className="w-6 h-6 text-primary transition-transform group-hover:rotate-12" />
            <span className="font-display text-xl font-bold text-gradient">DecodeAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/github">GitHub</NavLink>
            <NavLink to="/nocode">No-Code</NavLink>
            <NavLink to="/ai">AI</NavLink>
            <NavLink to="/eduprompt">EduPrompt</NavLink>
            <NavLink to="/resources">Resources</NavLink>
            <NavLink to="/about">About</NavLink>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={openSearch}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
      </nav>
    </>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to}>
    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
      {children}
    </Button>
  </Link>
);
