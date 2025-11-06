"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "GitHub", href: "/github" },
  { label: "No-Code", href: "/nocode" },
  { label: "AI", href: "/ai" },
  { label: "EduPrompt", href: "/eduprompt" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header = ({ onOpenSearch }: HeaderProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close sheet on navigation
  useEffect(() => {
    if (!isSheetOpen) return;
    setIsSheetOpen(false);
  }, [pathname, isSheetOpen]);

  const handleSearchOpen = () => {
    onOpenSearch();
    searchButtonRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
          <span className="text-lg font-semibold tracking-wide text-white">
            Decode<span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                pathname === href ? "text-white" : "hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
          <Button
            ref={searchButtonRef}
            variant="outline"
            size="sm"
            onClick={handleSearchOpen}
            aria-haspopup="dialog"
            className="ml-2 flex items-center gap-2 border border-white/20 bg-black text-sm text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search</span>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            ref={searchButtonRef}
            variant="outline"
            size="sm"
            onClick={handleSearchOpen}
            aria-haspopup="dialog"
            className="flex items-center gap-2 border border-white/20 bg-black text-sm text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Open search</span>
          </Button>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border border-white/20 bg-black text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full max-w-xs flex-col gap-6 border-l border-white/10 bg-zinc-950 text-white shadow-lg sm:max-w-sm"
              aria-modal="true"
              role="dialog"
            >
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle className="text-base font-semibold text-white">DecodeAI</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSheetOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full border border-white/10 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {NAV_LINKS.map(({ href, label }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className={cn(
                      "w-full rounded-md border border-white/10 px-4 py-2 text-left text-sm font-medium text-zinc-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      pathname === href ? "bg-white/10 text-white" : "hover:bg-white/10",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
