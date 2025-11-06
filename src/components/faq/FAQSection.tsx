"use client";

import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useResourcesData } from "@/features/resources/context/ResourcesDataContext";
import type { ResourceWithMeta } from "@/types/resources";
import { Button } from "@/components/ui/button";

interface FAQItem {
  id: string;
  question: string;
  answer: string[];
  levelMatch?: string[];
  keywordMatch?: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "choose-workflow",
    question: "How do I choose which project workflow to start with?",
    answer: [
      "Browse the topic grids and look for a problem space you already follow. Each card shows the goal, difficulty, and build time so you can gauge the effort up front.",
      "If you're new to AI projects, start with workflows that include clear data sources and shorter build times so you can ship something quickly.",
      "Open the project page and skim the tabs before diving in. Bookmark the page or copy the URL with the tab hash when you're ready to build.",
    ],
    levelMatch: ["Beginner", "All"],
  },
  {
    id: "offline-access",
    question: "Can I explore workflows and resources offline?",
    answer: [
      "Yes. Everything on this site is bundled locally. After you open a workflow once, your browser keeps it cached so revisiting the tabs works without a connection.",
      "Each tab has its own URL hash (for example, #workflow). Copy the address bar if you want to reopen a specific section later or share it with teammates.",
    ],
    keywordMatch: ["offline", "cache"],
  },
  {
    id: "share-workflows",
    question: "What is the recommended way to share a workflow with teammates?",
    answer: [
      "Open the project page, switch to the tab you want to highlight, and share the URL with the hash. Anyone who visits that link lands on the same section immediately.",
      "If you need a distraction-free view, keep the full project page open. It mirrors the drawer workflow but gives you the complete detail in one scrollable layout.",
    ],
    levelMatch: ["All"],
  },
  {
    id: "resource-suggestions",
    question: "How should I combine the learning resources with the project builds?",
    answer: [
      "Match the difficulty badge on a resource with the project you're tackling. Beginner playlists pair well with early prototypes; intermediate and advanced tracks help when you're validating metrics.",
      "Use the filters or the `/` shortcut to adjust the resource list while you work. Opening a resource stores it locally so you can revisit it from your browser history later.",
    ],
    levelMatch: ["Beginner", "Intermediate"],
  },
];

const getRelatedResources = (resources: ResourceWithMeta[], item: FAQItem) => {
  const matches = resources.filter((resource) => {
    const levelMatch = !item.levelMatch || item.levelMatch.includes(resource.level);
    const keywordMatch =
      !item.keywordMatch ||
      item.keywordMatch.some((keyword) =>
        resource.summary.toLowerCase().includes(keyword) || resource.takeaway.toLowerCase().includes(keyword),
      );
    return levelMatch || keywordMatch;
  });
  return matches.slice(0, 3);
};

export const FAQSection = () => {
  const { resources } = useResourcesData();

  const faqs = useMemo(
    () =>
      FAQ_ITEMS.map((item) => ({
        ...item,
        related: getRelatedResources(resources, item),
      })),
    [resources],
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Frequently Asked Questions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Honest answers and tips so you can focus on learning and shipping projects.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {faqs.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
                {item.answer.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {item.related.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Related Resources:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.related.map((resource) => (
                        <Button
                          key={resource.id}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}
                        >
                          {resource.title} ↗
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
