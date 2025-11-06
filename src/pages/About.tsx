import { motion } from 'framer-motion';
import { getAboutInfo } from '@/lib/data-utils';
import type { LucideIcon } from 'lucide-react';
import { Github, Linkedin, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/AnimatedHero';
import { TiltCard } from '@/components/TiltCard';

const About = () => {
  const aboutData = getAboutInfo();
  const hero = aboutData?.hero ?? {};
  const builder = aboutData?.builder ?? {};
  const sections = Array.isArray(aboutData?.sections) ? aboutData.sections : [];
  const socials = Array.isArray(builder?.socials) ? builder.socials : [];
  const cta = aboutData?.cta ?? {};
  const ctaButtons = Array.isArray(cta?.buttons) ? cta.buttons : [];

  const title = typeof aboutData?.title === 'string' ? aboutData.title : 'About DecodeAI';
  const description = typeof aboutData?.description === 'string' ? aboutData.description : '';
  const builderName = typeof builder?.name === 'string' ? builder.name : 'DecodeAI Builder';
  const builderRole = typeof builder?.role === 'string' ? builder.role : '';
  const builderText = typeof builder?.text === 'string' ? builder.text : '';
  const noteText = typeof aboutData?.note === 'string' ? aboutData.note : '';
  const ctaTitle = typeof cta?.title === 'string' ? cta.title : '';
  const ctaText = typeof cta?.text === 'string' ? cta.text : '';
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  const iconMap = {
    github: Github,
    linkedin: Linkedin,
    globe: Globe,
  } satisfies Record<string, LucideIcon>;

  const resolveIcon = (platform: string = ''): LucideIcon => {
    const key = platform.toLowerCase();
    return iconMap[key as keyof typeof iconMap] ?? Globe;
  };

  return (
    <div className="relative min-h-screen noise-texture">
      <AnimatedHero className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
        {/* Bio Section */}
        <motion.section {...fadeIn} className="mb-16">
          <TiltCard className="glass-card-soft ring-gradient-glow p-8 mt-8 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-3xl font-display font-bold">AB</span>
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold">
                  <span className="gradient-text-animated">{builderName}</span>
                </h2>
                <p className="text-muted-foreground">{builderRole}</p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {builderText}
            </p>

            <div className="bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-display text-xl font-semibold mb-3 text-primary">Mission</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </TiltCard>
        </motion.section>

        {/* Sections */}
        <motion.section {...fadeIn} className="mb-16">
          <h2 className="font-display text-3xl font-bold mb-8 text-center">{title}</h2>
          {sections.length === 0 ? (
            <div className="glass-card-subtle p-6 text-center text-muted-foreground">
              No sections to show yet.
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section, sectionIndex) => {
                const items = Array.isArray(section?.items) ? section.items : [];
                return (
                  <motion.div
                    key={`${section?.title ?? 'section'}-${sectionIndex}`}
                    {...fadeIn}
                    className="glass-card-soft ring-gradient-glow p-8 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300"
                  >
                    <h3 className="font-display text-2xl font-semibold mb-4">{section?.title}</h3>
                    {items.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {items.map((item, itemIndex) => (
                          <div key={`${item?.heading ?? 'item'}-${itemIndex}`} className="rounded-lg border border-border p-4 hover:border-primary/60 transition-colors">
                            <h4 className="font-semibold text-lg mb-2">{item?.heading}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">{item?.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{section?.text}</p>
                    )}
                    {section?.links && Array.isArray(section.links) && section.links.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {section.links.map((link, linkIndex) => (
                          <Button key={`${link?.label ?? 'link'}-${linkIndex}`} variant="outline" asChild>
                            <a href={link?.url} target="_blank" rel="noopener noreferrer">
                              {link?.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Socials */}
        <motion.section {...fadeIn} className="mb-16">
          <div className="glass-card-soft ring-gradient-glow p-8 text-center hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
            <h2 className="font-display text-3xl font-bold mb-6">Connect With Me</h2>
            <div className="flex justify-center gap-4 mb-8">
              {socials.map((social) => {
                const Icon = resolveIcon(social.platform);
                return (
                  <a
                    key={social.platform}
                    href={social.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card-softer w-16 h-16 flex items-center justify-center hover:scale-110 hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.4)] transition-all duration-300"
                  >
                    <Icon className="w-6 h-6 text-primary" />
                  </a>
                );
              })}
            </div>

            <Button size="lg" className="gap-2" asChild>
              <a href={socials[0]?.url ?? 'mailto:contact@example.com'}>
                <Mail className="w-5 h-5" />
                Get in Touch
              </a>
            </Button>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section {...fadeIn} className="mb-16">
          <div className="glass-card-soft ring-gradient-glow p-8 text-center hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
            <h2 className="font-display text-3xl font-bold mb-4">{ctaTitle}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{ctaText}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {ctaButtons.map((button) => (
                <Button key={button.label} size="lg" asChild>
                  <a href={button.url}>{button.label}</a>
                </Button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Note */}
        <motion.section {...fadeIn}>
          <div className="glass-card-softer p-6 text-center border-l-4 border-accent">
            <p className="text-sm text-muted-foreground">
              {noteText}
            </p>
          </div>
        </motion.section>
      </div>
      </AnimatedHero>
    </div>
  );
};

export default About;
