"use client";

import { Link } from "react-router-dom";
interface FooterProps {
  onOpenSearch: () => void;
}

export const Footer = ({ onOpenSearch }: FooterProps) => {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/60 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">DecodeAI</h3>
          <p className="mt-1 font-mono text-xs text-zinc-400">decodeAI.faq v1 | local session active</p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm text-zinc-300 md:grid-cols-3">
          <div className="space-y-2">
            <FooterLink to="/github" label="GitHub" />
            <FooterLink to="/nocode" label="No-Code" />
            <FooterLink to="/ai" label="AI" />
            <FooterLink to="/eduprompt" label="EduPrompt" />
          </div>

          <div className="space-y-2">
            <FooterLink to="/resources" label="Resources" />
            <FooterLink to="/about" label="About" />
            <button
              type="button"
              onClick={onOpenSearch}
              className="rounded-md border border-transparent px-1 py-0.5 text-left hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Search
            </button>
          </div>

          <div className="col-span-2 md:col-span-1">
            <p className="text-sm text-zinc-300">Build Together</p>
            <p className="mt-1 text-sm text-zinc-400">
              Projects built using DecodeAI by students around the world.
              Want to share yours?
              <br />
              Email <a href="mailto:aditya160509@gmail.com" className="text-indigo-300 underline">aditya160509@gmail.com</a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="text-center text-sm text-zinc-400">Built by students. Learn it. Ship it. Explain it.</p>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-1 rounded-md border border-transparent px-1 py-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
  >
    {label}
  </Link>
);
