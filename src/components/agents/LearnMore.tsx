'use client';

import { Link } from 'react-router-dom';

export function LearnMore() {
  const links = [
    { href: '/ai', label: 'AI practice hub' },
    { href: '/resources', label: 'Classroom resources' },
    { href: '/nocode', label: 'No code studio' },
    { href: '/github', label: 'GitHub workshop' }
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-4">
        <h3 className="font-display text-2xl text-white">Learn more</h3>
        <p className="text-sm text-slate-300">
          Continue exploring the DecodeAI curriculum with these internal guides.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition-colors hover:border-emerald-400/50 hover:text-emerald-100"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
