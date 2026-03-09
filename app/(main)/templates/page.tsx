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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="container mx-auto px-4 py-12 max-w-6xl">
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
              <div className="flex items-center gap-2 mb-6 text-muted-foreground/60">
                <cat.icon className="h-4 w-4" />
                <h2 className="text-sm font-bold tracking-tight">
                  {cat.name === "Recent" ? "Recently used" : cat.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                {cat.name === "Recent" && (
                  <div 
                    className="group cursor-pointer flex flex-col gap-3"
                    onClick={handleCreateBlank}
                  >
                    <div className="aspect-video relative rounded-xl border border-dashed hover:border-primary/50 bg-accent/5 flex items-center justify-center transition-all bg-muted/20">
                      <div className="h-10 w-10 rounded-full border border-dashed flex items-center justify-center">
                        {isCreating === "blank" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">Blank Quest</p>
                      <p className="text-xs text-muted-foreground">Start from scratch</p>
                    </div>
                  </div>
                )}

                {catTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="group cursor-pointer flex flex-col gap-3"
                    onClick={() => handleCreate(template.id)}
                  >
                    <div className="aspect-video relative overflow-hidden rounded-xl bg-muted border border-border/50 group-hover:border-primary/30 transition-all">
                      <Image
                        src={template.backgroundImage || "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"}
                        alt={template.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                      {isCreating === template.id && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {template.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
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
