"use client";

import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResourceFilters } from "@/types/resources";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: ResourceFilters;
  onChange: (next: ResourceFilters) => void;
  onClear: () => void;
  typeOptions: string[];
  levelOptions: string[];
  languageOptions: string[];
  topicOptions: Option[];
}

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export const FilterBar = forwardRef<HTMLInputElement, FilterBarProps>(
  ({ filters, onChange, onClear, typeOptions, levelOptions, languageOptions, topicOptions }, searchRef) => {
    const handleTopicChange = (value: string) => {
      onChange({ ...filters, topic: value === "all" ? null : value });
    };

    const handleTypeToggle = (type: string) => {
      onChange({ ...filters, type: toggleValue(filters.type, type) });
    };

    const handleLevelToggle = (level: string) => {
      onChange({ ...filters, level: toggleValue(filters.level, level) });
    };

    const handleLanguageChange = (value: string) => {
      onChange({ ...filters, lang: value === "all" ? [] : [value] });
    };

    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="resource-topic" className="text-xs font-medium text-muted-foreground">
                Topic
              </Label>
              <Select value={filters.topic ?? "all"} onValueChange={handleTopicChange}>
                <SelectTrigger id="resource-topic" className="w-[160px]">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topicOptions.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              {typeOptions.map((type) => {
                const active = filters.type.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeToggle(type)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                    )}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Level</span>
              {levelOptions.map((level) => {
                const active = filters.level.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelToggle(level)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                    )}
                  >
                    {level}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="resource-language" className="text-xs font-medium text-muted-foreground">
                Language
              </Label>
              <Select value={filters.lang[0] ?? "all"} onValueChange={handleLanguageChange}>
                <SelectTrigger id="resource-language" className="w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {languageOptions.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-80">
            <Input
              ref={searchRef}
              value={filters.q}
              onChange={(event) => onChange({ ...filters, q: event.target.value })}
              placeholder="Search resources…"
              aria-label="Search resources"
            />
            <Button type="button" variant="ghost" size="sm" onClick={onClear} aria-label="Clear all filters" className="self-start text-xs">
              Clear All
            </Button>
          </div>
        </div>
      </section>
    );
  },
);

FilterBar.displayName = "FilterBar";
