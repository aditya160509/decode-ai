import type { Intro } from '@/types/github';
import { Card } from '@/components/ui/card';

interface IntroSectionProps {
  intro: Intro | null;
  id?: string;
}

export const IntroSection = ({ intro, id }: IntroSectionProps) => (
  <section id={id} className="scroll-mt-28 space-y-10">
    <div className="text-center space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">DecodeAI · GitHub Basics</h1>
      <p className="text-lg text-muted-foreground">
        Master GitHub through clear concepts, copy-ready commands, an interactive terminal, and a gamified quiz. All offline and beginner-friendly.
      </p>
    </div>
    {intro && (
      <div className="grid gap-6">
        <Card className="glass-card glass-hover p-6 text-left space-y-3">
          <h2 className="font-display text-2xl text-primary">Why GitHub matters</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{intro.intro_text}</p>
        </Card>
      </div>
    )}
  </section>
);
