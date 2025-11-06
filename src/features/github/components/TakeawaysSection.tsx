interface TakeawaysSectionProps {
  takeaways: string[];
}

export const TakeawaysSection = ({ takeaways }: TakeawaysSectionProps) => (
  <section id="takeaways" className="scroll-mt-28 space-y-4">
    <header className="space-y-2">
      <h2 className="font-display text-3xl font-semibold">Takeaways</h2>
      <p className="text-muted-foreground">Three habits that keep your repos clean and collaboration smooth.</p>
    </header>
    <ul className="glass-card p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
      {takeaways.map((point) => (
        <li key={point} className="flex gap-3">
          <span className="text-primary">▹</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  </section>
);
