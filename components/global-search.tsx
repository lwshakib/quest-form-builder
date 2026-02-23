/**
 * GlobalSearch component provides a centralized search bar for the application.
 * It performs cross-entity searching across the user's Quests and public Templates.
 * Features debounced input to minimize API calls and a floating results panel.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, Layout, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Template } from "@/lib/templates";

export function GlobalSearch() {
  // Local state for the search query and fetched results
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    quests: { id: string; title: string; questions: { id: string; title: string }[] }[];
    templates: Template[];
  }>({
    quests: [],
    templates: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: Debounced Search
   * We wait for 300ms of inactivity before triggering the server action. 
   * This prevents excessive database load while the user is typing.
   */
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        // Call the server action to search quests and templates
        const res = await globalSearch(query);
        setResults(res);
        setIsLoading(false);
      } else {
        setResults({ quests: [], templates: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  /**
   * Effect: Click Outside
   * Closes the results dropdown if the user clicks anywhere else on the page.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handles user selection from the results list.
   * Redirects to the appropriate view based on the result type.
   */
  const handleSelect = (type: "quest" | "template", id: string) => {
    setIsOpen(false);
    setQuery("");
    if (type === "quest") {
      // Direct navigation to the quest builder/editor
      router.push(`/quests/${id}`);
    } else {
      // For templates, we navigate to the gallery and filter by the specific ID
      router.push(`/templates?search=${id}`);
    }
  };

  return (
    <div className="group relative w-full" ref={containerRef}>
      <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
      <Input
        placeholder="Find anything..."
        className="bg-muted/50 focus-visible:ring-primary/30 h-10 rounded-full border-none pl-10 transition-all focus-visible:ring-1"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {/* Floating Results Panel */}
      {isOpen && (query.trim() || isLoading) && (
        <div className="bg-popover border-border/50 animate-in fade-in slide-in-from-top-2 absolute top-12 right-0 left-0 z-[60] overflow-hidden rounded-2xl border shadow-2xl duration-200">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-primary/50 h-6 w-6 animate-spin" />
              </div>
            ) : results.quests.length === 0 && results.templates.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No matches found for &quot;{query}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-2">
                {/* Section: Your Quests */}
                {results.quests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-muted-foreground px-2 text-[10px] font-black tracking-widest uppercase">
                      Your Quests
                    </h4>
                    {results.quests.map((quest) => (
                      <button
                        key={quest.id}
                        onClick={() => handleSelect("quest", quest.id)}
                        className="hover:bg-muted/50 group/item flex w-full items-center justify-between rounded-xl p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/5 border-primary/10 rounded-lg border p-2">
                            <FileText className="text-primary h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="max-w-[200px] truncate text-sm font-bold">
                              {quest.title}
                            </p>
                            {quest.questions.length > 0 && (
                              <p className="text-muted-foreground text-[10px] font-medium">
                                Matched in {quest.questions.length} question
                                {quest.questions.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="text-primary h-4 w-4 opacity-0 transition-all group-hover/item:translate-x-1 group-hover/item:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Section: Templates */}
                {results.templates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-muted-foreground px-2 text-[10px] font-black tracking-widest uppercase">
                      Templates
                    </h4>
                    {results.templates.map((temp) => (
                      <button
                        key={temp.id}
                        onClick={() => handleSelect("template", temp.id)}
                        className="hover:bg-muted/50 group/item flex w-full items-center justify-between rounded-xl p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-muted border-border rounded-lg border p-2">
                            <Layout className="text-muted-foreground h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="max-w-[200px] truncate text-sm font-bold">{temp.title}</p>
                            <p className="text-muted-foreground text-[10px] font-medium">
                              {temp.category}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="text-primary h-4 w-4 opacity-0 transition-all group-hover/item:translate-x-1 group-hover/item:opacity-100" />
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
