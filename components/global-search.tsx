'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, Layout, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { globalSearch } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ quests: any[], templates: any[] }>({ quests: [], templates: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        const res = await globalSearch(query);
        setResults(res);
        setIsLoading(false);
      } else {
        setResults({ quests: [], templates: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'quest' | 'template', id: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'quest') {
      router.push(`/quests/${id}`);
    } else {
      // For templates, we might want to stay on gallery or create immediately
      // For now, let's go to gallery and maybe highlight? 
      // Or just create it immediately like the other buttons?
      // Let's go to templates page with a search param
      router.push(`/templates?search=${id}`);
    }
  };

  return (
    <div className="relative w-full group" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input 
        placeholder="Find anything..." 
        className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-full h-10"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (query.trim() || isLoading) && (
        <div className="absolute top-12 left-0 right-0 bg-popover border border-border/50 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              </div>
            ) : results.quests.length === 0 && results.templates.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No matches found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4 p-2">
                {results.quests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Quests</h4>
                    {results.quests.map((quest) => (
                      <button
                        key={quest.id}
                        onClick={() => handleSelect('quest', quest.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold truncate max-w-[200px]">{quest.title}</p>
                            {quest.questions.length > 0 && (
                              <p className="text-[10px] text-muted-foreground font-medium">
                                Matched in {quest.questions.length} question{quest.questions.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-primary" />
                      </button>
                    ))}
                  </div>
                )}

                {results.templates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Templates</h4>
                    {results.templates.map((temp) => (
                      <button
                        key={temp.id}
                        onClick={() => handleSelect('template', temp.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-lg border border-border">
                            <Layout className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold truncate max-w-[200px]">{temp.title}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{temp.category}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
