import "./globals.css";
import type { Metadata } from "next";
import GlobalOrb from "./components/GlobalOrb";

export const metadata: Metadata = {
  title: "DecodeAI",
  description: "Build real skills by doing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Global floating orb visible on all routes */}
        <GlobalOrb />
      </body>
    </html>
  );
}
