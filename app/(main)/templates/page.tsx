"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader2, User, Briefcase, GraduationCap, History } from "lucide-react";

import { TEMPLATES, Template } from "@/lib/templates";
import { createQuestFromTemplate, createQuest, getRecentTemplates } from "@/lib/actions";
import { toast } from "sonner";
import Image from "next/image";

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

  const categories: {
    name: Template["category"];
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
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
    } catch {
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
    } catch {
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
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-16">
        {categories.map((cat) => {
          const catTemplates =
            cat.name === "Recent"
              ? recentTemplates
              : filteredTemplates.filter((t) => t.category === cat.name);

          if (cat.name !== "Recent" && catTemplates.length === 0) return null;
          if (cat.name === "Recent" && catTemplates.length === 0) return null;

          return (
            <section key={cat.name}>
              <div className="text-muted-foreground/60 mb-6 flex items-center gap-2">
                <cat.icon className="h-4 w-4" />
                <h2 className="text-sm font-bold tracking-tight">
                  {cat.name === "Recent" ? "Recently used" : cat.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {cat.name === "Recent" && (
                  <div
                    className="group flex cursor-pointer flex-col gap-3"
                    onClick={handleCreateBlank}
                  >
                    <div className="hover:border-primary/50 bg-accent/5 bg-muted/20 relative flex aspect-video items-center justify-center rounded-xl border border-dashed transition-all">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
                        {isCreating === "blank" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="group-hover:text-primary text-sm font-semibold transition-colors">
                        Blank Quest
                      </p>
                      <p className="text-muted-foreground text-xs">Start from scratch</p>
                    </div>
                  </div>
                )}

                {catTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group flex cursor-pointer flex-col gap-3"
                    onClick={() => handleCreate(template.id)}
                  >
                    <div className="bg-muted border-border/50 group-hover:border-primary/30 relative aspect-video overflow-hidden rounded-xl border transition-all">
                      <Image
                        src={
                          template.backgroundImage ||
                          "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={template.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {isCreating === template.id && (
                        <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
                        {template.title}
                      </p>
                      <p className="text-muted-foreground line-clamp-1 text-xs font-medium">
                        {template.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
