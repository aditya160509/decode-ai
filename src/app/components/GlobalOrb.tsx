"use client";

import { Terminal } from "lucide-react";

export default function GlobalOrb() {
  return (
    <button
      aria-label="Orb"
      className="
        fixed bottom-6 right-6 md:bottom-8 md:right-8
        z-[9999]
        h-12 w-12 rounded-full
        bg-gradient-to-r from-purple-500 to-blue-500
        shadow-lg
        flex items-center justify-center
        text-white
        hover:opacity-90
        transition
      "
    >
      <Terminal size={20} />
    </button>
  );
}
