"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  History,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEMPLATES, Template } from "@/lib/templates";
import { createQuestFromTemplate, createQuest, getRecentTemplates } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      const template = TEMPLATES.find((t) => t.id === query);
      if (template) {
        setSearch(template.title);
      } else {
        setSearch(query);
      }
    }
    getRecentTemplates().then(setRecentTemplateIds);
  }, [searchParams]);

  const categories: { name: Template["category"]; icon: any }[] = [
    { name: "Recent", icon: History },
    { name: "Personal", icon: User },
    { name: "Work", icon: Briefcase },
    { name: "Education", icon: GraduationCap },
  ];

  const handleCreate = async (templateId: string) => {
    setIsCreating(templateId);
    try {
      const quest = await createQuestFromTemplate(templateId);
      router.push(`/quests/${quest.id}`);
    } catch (error) {
      toast.error("Failed to create quest from template");
    } finally {
      setIsCreating(null);
    }
  };

  const handleCreateBlank = async () => {
    setIsCreating("blank");
    try {
      const quest = await createQuest("Untitled Quest");
      router.push(`/quests/${quest.id}`);
    } catch (error) {
      toast.error("Failed to create quest");
    } finally {
      setIsCreating(null);
    }
  };

  const filteredTemplates = TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const recentTemplates = recentTemplateIds
    .map((id) => TEMPLATES.find((t) => t.id === id))
    .filter(Boolean) as Template[];

  return (
    <div className="bg-background min-h-screen">
      {/* Sticky Header - Offset by main header height (h-16) */}
      <div className="bg-background/80 sticky top-16 z-40 border-b backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between gap-6 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-black tracking-tight">Template Gallery</h1>
          </div>

          <div className="group relative max-w-xl flex-1">
            <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
            <Input
              placeholder="Search for templates..."
              className="bg-muted/50 focus-visible:ring-primary/20 h-12 rounded-2xl border-none pl-12 font-medium transition-all focus-visible:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-20 px-4 py-12 lg:px-8">
        {/* Categories */}
        {categories.map((cat) => {
          const catTemplates =
            cat.name === "Recent"
              ? recentTemplates
              : filteredTemplates.filter((t) => t.category === cat.name);
          if (cat.name !== "Recent" && catTemplates.length === 0) return null;

          return (
            <section key={cat.name} className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-muted-foreground flex items-center gap-2 text-xl font-bold tracking-tight uppercase">
                  <cat.icon className="h-5 w-5" />{" "}
                  {cat.name === "Recent" ? "Recently used templates" : cat.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {cat.name === "Recent" && (
                  <button
                    onClick={handleCreateBlank}
                    disabled={!!isCreating}
                    className="group flex flex-col items-start gap-4 text-left transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="border-border bg-card hover:bg-primary/5 hover:border-primary/40 relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed shadow-sm transition-all duration-500 hover:shadow-xl">
                      <div className="bg-primary/5 group-hover:bg-primary/10 border-primary/10 rounded-full border p-3 transition-all duration-500 group-hover:scale-110">
                        {isCreating === "blank" ? (
                          <Loader2 className="text-primary h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="text-primary h-5 w-5" />
                        )}
                      </div>
                      {isCreating === "blank" && (
                        <div className="bg-background/60 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="text-primary h-8 w-8 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="group-hover:text-primary text-base font-bold transition-colors">
                        Blank Quest
                      </h3>
                      <p className="text-muted-foreground line-clamp-1 text-xs font-medium">
                        Start from scratch
                      </p>
                    </div>
                  </button>
                )}

                {catTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreate(template.id)}
                    disabled={!!isCreating}
                    className="group flex flex-col items-start gap-4 text-left transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="border-border relative aspect-[16/9] w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl">
                      <img
                        src={
                          template.backgroundImage ||
                          "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={template.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                      {isCreating === template.id && (
                        <div className="bg-background/60 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="text-primary h-8 w-8 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="group-hover:text-primary text-base font-bold transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-1 text-xs font-medium">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
