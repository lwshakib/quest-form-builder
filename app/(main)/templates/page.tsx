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
import {
  createQuestFromTemplate,
  createQuest,
  getRecentTemplates,
} from "@/lib/actions";
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
    <div className="min-h-screen bg-background">
      {/* Sticky Header - Offset by main header height (h-16) */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-black tracking-tight">
              Template Gallery
            </h1>
          </div>

          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search for templates..."
              className="pl-12 h-12 bg-muted/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4 lg:px-8 space-y-20">
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
                <h2 className="text-xl font-bold tracking-tight text-muted-foreground uppercase flex items-center gap-2">
                  <cat.icon className="h-5 w-5" />{" "}
                  {cat.name === "Recent" ? "Recently used templates" : cat.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {cat.name === "Recent" && (
                  <button
                    onClick={handleCreateBlank}
                    disabled={!!isCreating}
                    className="group flex flex-col items-start gap-4 text-left transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-dashed border-border bg-card hover:bg-primary/5 transition-all duration-500 hover:border-primary/40 shadow-sm hover:shadow-xl flex items-center justify-center">
                      <div className="bg-primary/5 p-3 rounded-full group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-primary/10">
                        {isCreating === "blank" ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {isCreating === "blank" && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                        Blank Quest
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
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
                    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
                      <img
                        src={
                          template.backgroundImage ||
                          "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={template.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      {isCreating === template.id && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
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
