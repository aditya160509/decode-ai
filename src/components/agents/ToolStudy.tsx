'use client';

import sections from '../../data/sections.json';
import tools from '../../data/agentTools.json';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type ToolStudyProps = {
  onLoadTool: (toolId: string) => void;
};

export function ToolStudy({ onLoadTool }: ToolStudyProps) {
  const intro = sections.sections.find((section) => section.slug === 'tool_study_intro');

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl text-white">{intro?.title ?? 'Tool study'}</h3>
          <p className="text-sm text-slate-300">
            {intro?.body}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="border-white/10 bg-black/60 text-slate-100">
              <CardHeader>
                <CardTitle className="text-lg text-white">{tool.name}</CardTitle>
                <p className="text-xs uppercase tracking-wide text-emerald-200">{tool.category}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200">
                <p>{tool.purpose}</p>
                <p className="text-xs text-slate-300">Ideal use {tool.ideal_use}</p>
                <p className="text-xs text-slate-300">Strength {tool.strength}</p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => onLoadTool(tool.id)}
                >
                  Load into composer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/60 p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white">Tool</TableHead>
                <TableHead className="text-white">Purpose</TableHead>
                <TableHead className="text-white">Strength</TableHead>
                <TableHead className="text-white">Ideal use</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id} className="border-white/5">
                  <TableCell className="font-semibold text-slate-100">{tool.name}</TableCell>
                  <TableCell className="text-sm text-slate-200">{tool.purpose}</TableCell>
                  <TableCell className="text-sm text-slate-200">{tool.strength}</TableCell>
                  <TableCell className="text-sm text-slate-200">{tool.ideal_use}</TableCell>
                  <TableCell className="text-sm text-slate-200">{tool.type}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onLoadTool(tool.id)}>
                      Load
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
