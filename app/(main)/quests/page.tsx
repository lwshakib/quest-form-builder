"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Layout,
  ArrowRight,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Send,
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEMPLATES, Template } from "@/lib/templates";
import {
  createQuest,
  getQuests,
  updateQuest,
  deleteQuest,
  createQuestFromTemplate,
  getRecentTemplates,
} from "@/lib/actions";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  status: string;
  responses?: number;
  updatedAt: string | Date;
}

// Template interface removed, using import instead

export default function QuestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      const [questsData, recentData] = await Promise.all([getQuests(), getRecentTemplates()]);
      setQuests(questsData);
      setRecentTemplateIds(recentData);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recentTemplates = recentTemplateIds
    .map((id) => TEMPLATES.find((t) => t.id === id))
    .filter((t): t is Template => !!t);

  const handleCreateBlankQuest = async () => {
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

  const handleCreateFromTemplate = async (templateId: string) => {
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

  const handleDeleteQuest = async (id: string) => {
    toast.promise(deleteQuest(id), {
      loading: "Deleting quest...",
      success: () => {
        setQuests(quests.filter((q: Quest) => q.id !== id));
        return "Quest deleted successfully";
      },
      error: "Failed to delete quest",
    });
  };

  const handleRenameQuest = async () => {
    if (!selectedQuest || !newTitle.trim()) return;

    setIsUpdating(true);
    try {
      await updateQuest(selectedQuest.id, { title: newTitle });
      setQuests(
        quests.map((q: Quest) => (q.id === selectedQuest.id ? { ...q, title: newTitle } : q)),
      );
      setIsRenameDialogOpen(false);
      toast.success("Quest renamed successfully");
    } catch {
      toast.error("Failed to rename quest");
    } finally {
      setIsUpdating(false);
    }
  };

  const openRenameDialog = (quest: Quest) => {
    setSelectedQuest(quest);
    setNewTitle(quest.title);
    setIsRenameDialogOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 container mx-auto space-y-16 px-4 py-10 duration-1000 lg:px-8">
      {/* Hero Section / Create Section */}
      <section className="space-y-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-4 text-center md:text-left">
            <div className="bg-primary/5 border-primary/10 inline-flex animate-pulse items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm">
              <Sparkles className="text-primary h-3.5 w-3.5" />
              <span className="text-primary text-[10px] font-black tracking-[0.2em] uppercase">
                New Creation
              </span>
            </div>
            <h1 className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-sm md:text-6xl">
              Launch a Quest
            </h1>
            <p className="text-muted-foreground/70 max-w-xl text-xl leading-relaxed font-medium">
              Design beautiful forms, surveys, and quizzes with our intuitive builder.
            </p>
          </div>

          <Button
            variant="ghost"
            className="group bg-card border-border/40 hover:bg-primary/5 hover:border-primary/20 h-14 gap-3 rounded-2xl border px-8 font-bold tracking-tight transition-all duration-300"
            onClick={() => router.push("/templates")}
          >
            <span>Explore Templates</span>
            <Layout className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Main Blank Canvas Card */}
          <button
            disabled={!!isCreating}
            onClick={handleCreateBlankQuest}
            className="group bg-card hover:bg-accent/50 border-border/50 hover:shadow-primary/5 relative flex h-64 flex-col items-start justify-between overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500 hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 -rotate-12 p-8 opacity-5 transition-all duration-700 group-hover:scale-110 group-hover:opacity-10">
              <Plus className="h-32 w-32" />
            </div>

            <div className="bg-primary shadow-primary/30 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110">
              {isCreating === "blank" ? (
                <Loader2 className="text-primary-foreground h-6 w-6 animate-spin" />
              ) : (
                <Plus className="text-primary-foreground h-7 w-7 stroke-[3px]" />
              )}
            </div>

            <div className="text-left">
              <h3 className="mb-1 text-2xl font-black tracking-tight">Blank Quest</h3>
              <p className="text-muted-foreground/80 text-sm font-medium">Start from scratch</p>
            </div>
          </button>

          {/* Recent Templates or Placeholder */}
          {recentTemplates.length > 0 ? (
            recentTemplates.map((template: Template) => (
              <button
                key={template.id}
                disabled={!!isCreating}
                onClick={() => handleCreateFromTemplate(template.id)}
                className="group bg-card border-border/40 hover:border-primary/40 relative flex h-64 flex-col items-start justify-end overflow-hidden rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl disabled:opacity-50"
              >
                <div className="absolute inset-0 z-0">
                  <Image
                    src={
                      template.backgroundImage ||
                      "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt={template.title}
                    fill
                    className="object-cover opacity-30 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-60 group-hover:grayscale-0"
                  />
                  <div className="from-card via-card/60 absolute inset-0 bg-gradient-to-t to-transparent" />
                </div>

                <div className="relative z-10 w-full p-8 text-left">
                  <div className="bg-background/80 border-border/50 group-hover:bg-primary group-hover:border-primary mb-4 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300">
                    {isCreating === template.id ? (
                      <Loader2 className="text-primary h-5 w-5 animate-spin" />
                    ) : (
                      <Layout className="text-muted-foreground group-hover:text-primary-foreground h-5 w-5 transition-all duration-300" />
                    )}
                  </div>
                  <h3 className="mb-1 text-xl font-bold tracking-tight">{template.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-primary/80 text-[10px] font-black tracking-widest uppercase">
                      Recent
                    </span>
                    <div className="bg-primary/30 h-1 w-1 rounded-full" />
                    <span className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
                      {template.category}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <button
              onClick={() => router.push("/templates")}
              className="group bg-accent/5 border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] relative flex h-64 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500"
            >
              <div className="from-primary/[0.03] absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="bg-muted/50 group-hover:bg-primary/10 border-border/50 mb-4 rounded-3xl border p-6 transition-all duration-500 group-hover:scale-110">
                <Layout className="text-muted-foreground/40 group-hover:text-primary h-8 w-8 transition-colors" />
              </div>
              <span className="text-muted-foreground/80 group-hover:text-foreground text-lg font-bold tracking-tight transition-colors">
                Start from Template
              </span>
              <p className="text-muted-foreground/40 mt-1 text-xs font-bold tracking-widest uppercase">
                Browse 20+ designs
              </p>
            </button>
          )}

          {/* Add more placeholders if fewer than 3 recent templates */}
          {recentTemplates.length > 0 && recentTemplates.length < 3 && (
            <button
              onClick={() => router.push("/templates")}
              className="group border-border/30 hover:border-primary/20 hover:bg-accent/5 relative flex h-64 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500"
            >
              <ArrowRight className="text-muted-foreground/20 group-hover:text-primary/40 h-8 w-8 transition-all group-hover:translate-x-2" />
              <span className="text-muted-foreground/30 mt-4 text-sm font-bold">View Gallery</span>
            </button>
          )}
        </div>
      </section>

      {/* Quests List */}
      <section className="space-y-10">
        <div className="border-border/30 flex flex-col justify-between gap-6 border-b pb-10 md:flex-row md:items-end">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-3xl font-black tracking-tighter">Your Library</h2>
            <p className="text-muted-foreground text-sm font-medium opacity-80">
              Manage and monitor all your active quests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="group relative w-full md:w-80">
              <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
              <Input
                placeholder="Search..."
                className="bg-accent/20 focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 h-11 w-full rounded-xl border-none pl-10 text-sm shadow-inner transition-all focus-visible:ring-2 md:w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-card border-border h-11 w-11 shrink-0 rounded-xl shadow-sm"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-accent/10 h-64 animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="bg-accent/5 border-border animate-in zoom-in-95 flex flex-col items-center justify-center rounded-[4rem] border-2 border-dashed p-32 text-center duration-700">
            <div className="bg-primary/5 shadow-primary/5 border-primary/10 mb-8 rounded-full border p-8 shadow-2xl">
              <FileText className="text-primary/30 h-16 w-16" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tighter">Your library is empty</h3>
              <p className="text-muted-foreground max-w-sm text-lg font-medium opacity-80">
                Create your first quest to start collecting meaningful insights from your audience.
              </p>
            </div>
            <Button
              className="shadow-primary/20 mt-12 h-16 rounded-full px-12 text-xl font-black shadow-2xl transition-all hover:scale-105"
              onClick={handleCreateBlankQuest}
            >
              Create Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {quests
              .filter((q: Quest) => q.title.toLowerCase().includes(search.toLowerCase()))
              .map((quest: Quest) => (
                <div
                  key={quest.id}
                  className="group border-border/50 bg-card/10 hover:border-primary/30 relative flex h-72 flex-col overflow-hidden rounded-3xl border shadow-sm backdrop-blur-xl transition-all duration-500 hover:shadow-xl"
                >
                  <div className="from-primary/10 via-primary to-primary/10 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r opacity-30 transition-opacity duration-700 group-hover:opacity-100" />

                  <div className="z-10 flex items-start justify-between p-6 pb-4">
                    <div className="bg-primary/5 group-hover:bg-primary/10 border-primary/5 rounded-xl border p-3 shadow-inner transition-all duration-500 group-hover:scale-110">
                      <FileText className="text-primary h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={quest.status === "Active" ? "default" : "secondary"}
                        className="rounded-full px-3 py-1 text-[8px] font-black tracking-tight uppercase"
                      >
                        {quest.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-muted/20 h-8 w-8 rounded-full opacity-0 transition-all duration-500 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-border/50 w-48 rounded-xl border p-1 shadow-2xl backdrop-blur-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => router.push(`/quests/${quest.id}`)}
                            className="h-9 cursor-pointer gap-2 rounded-lg text-sm font-medium"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/share/${quest.id}`, "_blank")}
                            className="h-9 cursor-pointer gap-2 rounded-lg text-sm font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRenameDialog(quest)}
                            className="h-9 cursor-pointer gap-2 rounded-lg text-sm font-medium"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="opacity-50" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="text-destructive focus:bg-destructive h-9 cursor-pointer gap-2 rounded-lg text-sm font-bold transition-colors focus:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div
                    className="flex flex-1 cursor-pointer flex-col px-6"
                    onClick={() => router.push(`/quests/${quest.id}`)}
                  >
                    <h3 className="group-hover:text-primary mt-2 line-clamp-2 text-xl leading-tight font-black tracking-tight transition-colors">
                      {quest.title}
                    </h3>

                    <div className="text-muted-foreground/40 mt-4 flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        <span>{quest.responses || 0} responses</span>
                      </div>
                      <div className="bg-border h-1 w-1 rounded-full" />
                      <span>{new Date(quest.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="border-border/5 bg-accent/5 mt-auto border-t p-5">
                    <Button
                      variant="ghost"
                      className="group/btn text-primary/70 hover:text-primary h-9 w-full justify-between rounded-lg px-3 text-xs font-black tracking-widest uppercase hover:bg-transparent"
                      onClick={() => router.push(`/quests/${quest.id}`)}
                    >
                      Open Quest{" "}
                      <ArrowRight className="h-4 w-4 transform transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-popover/95 border-border animate-in zoom-in-95 rounded-[3rem] border p-12 shadow-2xl backdrop-blur-3xl duration-300 sm:max-w-lg">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-4xl font-black tracking-tighter">Rename Quest</DialogTitle>
            <DialogDescription className="text-muted-foreground/80 text-lg leading-relaxed font-medium">
              Updating your quest name will help you stay organized in your library.
            </DialogDescription>
          </DialogHeader>
          <div className="py-10">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 2024 Product Roadmap"
              className="bg-accent/20 focus-visible:ring-primary/10 placeholder:text-muted-foreground/20 h-20 rounded-2xl border-none px-8 text-2xl font-black shadow-inner transition-all focus-visible:ring-4"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameQuest()}
            />
          </div>
          <DialogFooter className="flex-col gap-4 sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="border-border/50 hover:bg-accentTransition order-2 h-16 rounded-2xl px-10 text-lg font-black duration-300 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameQuest}
              disabled={isUpdating || !newTitle.trim()}
              className="shadow-primary/20 order-1 h-16 min-w-[180px] rounded-2xl px-10 text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95 sm:order-2"
            >
              {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
