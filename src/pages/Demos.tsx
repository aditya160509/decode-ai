import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDemoTexts } from '@/lib/data-utils';
import type { DemoEntry } from '@/lib/data-utils';
import { Download, Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Demos = () => {
  const demoData = getDemoTexts();
  const summarizeData = demoData.summarize;
  const classifyData = demoData.classify;
  const extractData = demoData.extract;
  
  const [selectedSummarize, setSelectedSummarize] = useState('');
  const [selectedClassify, setSelectedClassify] = useState('');
  const [selectedExtract, setSelectedExtract] = useState('');
  
  const [summarizeOutput, setSummarizeOutput] = useState('');
  const [classifyOutput, setClassifyOutput] = useState('');
  const [extractOutput, setExtractOutput] = useState('');

  const findDemoById = (items: DemoEntry[], id: string) => items.find((item) => item.id === id);

  const runSummarize = () => {
    const demo = findDemoById(summarizeData, selectedSummarize);
    if (demo) {
      setSummarizeOutput(demo.output);
      toast.success('Demo complete!');
    } else {
      toast.error('Please select a sample first');
    }
  };

  const runClassify = () => {
    const demo = findDemoById(classifyData, selectedClassify);
    if (demo) {
      setClassifyOutput(demo.output);
      toast.success('Demo complete!');
    } else {
      toast.error('Please select a sample first');
    }
  };

  const runExtract = () => {
    const demo = findDemoById(extractData, selectedExtract);
    if (demo) {
      setExtractOutput(demo.output);
      toast.success('Demo complete!');
    } else {
      toast.error('Please select a sample first');
    }
  };

  const downloadResult = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast.success('Downloaded!');
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div {...fadeIn} className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 heading-gradient">
            Mini Demos
          </h1>
          <p className="text-xl text-muted-foreground">
            Run safe pre-computed AI demos without API keys.
          </p>
        </motion.div>

        <motion.div {...fadeIn}>
          <Tabs defaultValue="summarize" className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-card">
              <TabsTrigger value="summarize">Summarize</TabsTrigger>
              <TabsTrigger value="classify">Classify</TabsTrigger>
              <TabsTrigger value="extract">Extract</TabsTrigger>
            </TabsList>

            {/* Summarize Tab */}
            <TabsContent value="summarize" className="mt-6">
              <div className="glass-card p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Sample Text</label>
                  <Select value={selectedSummarize} onValueChange={setSelectedSummarize}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Choose a sample..." />
                    </SelectTrigger>
                    <SelectContent>
                      {summarizeData.map((demo) => (
                        <SelectItem key={demo.id} value={demo.id}>
                          {demo.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSummarize && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      {findDemoById(summarizeData, selectedSummarize)?.text}
                    </p>
                  </div>
                )}

                <Button onClick={runSummarize} className="w-full gap-2" size="lg">
                  <Play className="w-4 h-4" />
                  Run Demo
                </Button>

                {summarizeOutput && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Summary:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadResult(summarizeOutput, 'summary.txt')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm">{summarizeOutput}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Classify Tab */}
            <TabsContent value="classify" className="mt-6">
              <div className="glass-card p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Sample Text</label>
                  <Select value={selectedClassify} onValueChange={setSelectedClassify}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Choose a sample..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classifyData.map((demo) => (
                        <SelectItem key={demo.id} value={demo.id}>
                          {demo.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClassify && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      {findDemoById(classifyData, selectedClassify)?.text}
                    </p>
                  </div>
                )}

                <Button onClick={runClassify} className="w-full gap-2" size="lg">
                  <Play className="w-4 h-4" />
                  Run Demo
                </Button>

                {classifyOutput && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-success">Classification:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadResult(classifyOutput, 'classification.txt')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-line">{classifyOutput}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Extract Tab */}
            <TabsContent value="extract" className="mt-6">
              <div className="glass-card p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Sample Text</label>
                  <Select value={selectedExtract} onValueChange={setSelectedExtract}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Choose a sample..." />
                    </SelectTrigger>
                    <SelectContent>
                      {extractData.map((demo) => (
                        <SelectItem key={demo.id} value={demo.id}>
                          {demo.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedExtract && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      {findDemoById(extractData, selectedExtract)?.text}
                    </p>
                  </div>
                )}

                <Button onClick={runExtract} className="w-full gap-2" size="lg">
                  <Play className="w-4 h-4" />
                  Run Demo
                </Button>

                {extractOutput && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-accent">Extracted Data:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadResult(extractOutput, 'extracted.txt')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap font-mono">{extractOutput}</pre>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Demos;
