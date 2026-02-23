"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { TEMPLATES } from "@/lib/templates";
import {
  createQuest,
  getQuests,
  updateQuest,
  deleteQuest,
  createQuestFromTemplate,
  getRecentTemplates,
} from "@/lib/actions";
import { toast } from "sonner";

export default function QuestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [quests, setQuests] = useState<any[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      const [questsData, recentData] = await Promise.all([
        getQuests(),
        getRecentTemplates(),
      ]);
      setQuests(questsData);
      setRecentTemplateIds(recentData);
    } catch (error) {
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
    .filter(Boolean);

  const handleCreateBlankQuest = async () => {
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

  const handleCreateFromTemplate = async (templateId: string) => {
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

  const handleDeleteQuest = async (id: string) => {
    toast.promise(deleteQuest(id), {
      loading: "Deleting quest...",
      success: () => {
        setQuests(quests.filter((q) => q.id !== id));
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
        quests.map((q) =>
          q.id === selectedQuest.id ? { ...q, title: newTitle } : q,
        ),
      );
      setIsRenameDialogOpen(false);
      toast.success("Quest renamed successfully");
    } catch (error) {
      toast.error("Failed to rename quest");
    } finally {
      setIsUpdating(false);
    }
  };

  const openRenameDialog = (quest: any) => {
    setSelectedQuest(quest);
    setNewTitle(quest.title);
    setIsRenameDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4 lg:px-8">
      {/* Hero Section / Create Section */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm animate-pulse">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                New Creation
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground drop-shadow-sm">
              Launch a Quest
            </h1>
            <p className="text-xl text-muted-foreground/70 max-w-xl font-medium leading-relaxed">
              Design beautiful forms, surveys, and quizzes with our intuitive
              builder.
            </p>
          </div>

          <Button
            variant="ghost"
            className="group h-14 rounded-2xl px-8 bg-card border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 font-bold tracking-tight gap-3"
            onClick={() => router.push("/templates")}
          >
            <span>Explore Templates</span>
            <Layout className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Main Blank Canvas Card */}
          <button
            disabled={!!isCreating}
            onClick={handleCreateBlankQuest}
            className="group relative flex flex-col items-start justify-between p-8 h-64 bg-card hover:bg-accent/50 border border-border/50 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] overflow-hidden disabled:opacity-50"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 -rotate-12 translate-x-4 -translate-y-4">
              <Plus className="h-32 w-32" />
            </div>

            <div className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
              {isCreating === "blank" ? (
                <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
              ) : (
                <Plus className="h-7 w-7 text-primary-foreground stroke-[3px]" />
              )}
            </div>

            <div className="text-left">
              <h3 className="text-2xl font-black tracking-tight mb-1">
                Blank Quest
              </h3>
              <p className="text-sm font-medium text-muted-foreground/80">
                Start from scratch
              </p>
            </div>
          </button>

          {/* Recent Templates or Placeholder */}
          {recentTemplates.length > 0 ? (
            recentTemplates.map((template: any) => (
              <button
                key={template.id}
                disabled={!!isCreating}
                onClick={() => handleCreateFromTemplate(template.id)}
                className="group relative flex flex-col items-start justify-end h-64 bg-card border border-border/40 rounded-[2.5rem] transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden disabled:opacity-50"
              >
                <div className="absolute inset-0 z-0">
                  <img
                    src={
                      template.backgroundImage ||
                      "https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt={template.title}
                    className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>

                <div className="relative z-10 p-8 w-full text-left">
                  <div className="mb-4 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    {isCreating === template.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Layout className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-all duration-300" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">
                    {template.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                      Recent
                    </span>
                    <div className="h-1 w-1 rounded-full bg-primary/30" />
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      {template.category}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <button
              onClick={() => router.push("/templates")}
              className="group relative flex flex-col items-center justify-center h-64 bg-accent/5 border-2 border-dashed border-border/50 rounded-[2.5rem] transition-all duration-500 hover:border-primary/30 hover:bg-primary/[0.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-muted/50 p-6 rounded-3xl mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-border/50">
                <Layout className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
              <span className="font-bold text-lg tracking-tight text-muted-foreground/80 group-hover:text-foreground transition-colors">
                Start from Template
              </span>
              <p className="text-xs text-muted-foreground/40 mt-1 font-bold uppercase tracking-widest">
                Browse 20+ designs
              </p>
            </button>
          )}

          {/* Add more placeholders if fewer than 3 recent templates */}
          {recentTemplates.length > 0 && recentTemplates.length < 3 && (
            <button
              onClick={() => router.push("/templates")}
              className="group relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/30 rounded-[2.5rem] transition-all duration-500 hover:border-primary/20 hover:bg-accent/5 overflow-hidden"
            >
              <ArrowRight className="h-8 w-8 text-muted-foreground/20 group-hover:text-primary/40 group-hover:translate-x-2 transition-all" />
              <span className="text-sm font-bold text-muted-foreground/30 mt-4">
                View Gallery
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Quests List */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/30 pb-10">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-3xl font-black tracking-tighter">
              Your Library
            </h2>
            <p className="text-muted-foreground text-sm font-medium opacity-80">
              Manage and monitor all your active quests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search..."
                className="pl-10 h-11 bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl shadow-inner transition-all w-full md:w-80 text-sm placeholder:text-muted-foreground/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-11 w-11 rounded-xl hover:bg-card border-border shadow-sm"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-[2.5rem] bg-accent/10 animate-pulse"
              />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-32 bg-accent/5 border-2 border-dashed border-border rounded-[4rem] text-center animate-in zoom-in-95 duration-700">
            <div className="p-8 bg-primary/5 rounded-full mb-8 shadow-2xl shadow-primary/5 border border-primary/10">
              <FileText className="h-16 w-16 text-primary/30" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tighter">
                Your library is empty
              </h3>
              <p className="text-muted-foreground max-w-sm text-lg font-medium opacity-80">
                Create your first quest to start collecting meaningful insights
                from your audience.
              </p>
            </div>
            <Button
              className="mt-12 h-16 rounded-full px-12 text-xl font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
              onClick={handleCreateBlankQuest}
            >
              Create Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {quests
              .filter((q) =>
                q.title.toLowerCase().includes(search.toLowerCase()),
              )
              .map((quest) => (
                <div
                  key={quest.id}
                  className="group relative overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 bg-card/10 backdrop-blur-xl rounded-3xl hover:border-primary/30 flex flex-col h-72"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10 opacity-30 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="p-6 pb-4 flex justify-between items-start z-10">
                    <div className="bg-primary/5 p-3 rounded-xl shadow-inner group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-primary/5">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          quest.status === "Active" ? "default" : "secondary"
                        }
                        className="rounded-full px-3 py-1 text-[8px] font-black tracking-tight uppercase"
                      >
                        {quest.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-muted/20 opacity-0 group-hover:opacity-100 transition-all duration-500"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 p-1 rounded-xl border border-border/50 shadow-2xl backdrop-blur-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => router.push(`/quests/${quest.id}`)}
                            className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/share/${quest.id}`, "_blank")
                            }
                            className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRenameDialog(quest)}
                            className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="opacity-50" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="text-destructive focus:text-white focus:bg-destructive gap-2 rounded-lg h-9 cursor-pointer text-sm font-bold transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div
                    className="px-6 flex-1 flex flex-col cursor-pointer"
                    onClick={() => router.push(`/quests/${quest.id}`)}
                  >
                    <h3 className="line-clamp-2 text-xl font-black group-hover:text-primary transition-colors leading-tight tracking-tight mt-2">
                      {quest.title}
                    </h3>

                    <div className="mt-4 flex items-center gap-4 text-xs font-bold text-muted-foreground/40">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        <span>{quest.responses || 0} responses</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <span>
                        {new Date(quest.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 mt-auto border-t border-border/5 bg-accent/5">
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-9 rounded-lg px-3 group/btn text-xs font-black uppercase tracking-widest text-primary/70 hover:text-primary hover:bg-transparent"
                      onClick={() => router.push(`/quests/${quest.id}`)}
                    >
                      Open Quest{" "}
                      <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover/95 backdrop-blur-3xl border border-border shadow-2xl rounded-[3rem] p-12 animate-in zoom-in-95 duration-300">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-4xl font-black tracking-tighter">
              Rename Quest
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground/80 font-medium leading-relaxed">
              Updating your quest name will help you stay organized in your
              library.
            </DialogDescription>
          </DialogHeader>
          <div className="py-10">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 2024 Product Roadmap"
              className="h-20 bg-accent/20 border-none focus-visible:ring-4 focus-visible:ring-primary/10 rounded-2xl text-2xl font-black px-8 shadow-inner transition-all placeholder:text-muted-foreground/20"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameQuest()}
            />
          </div>
          <DialogFooter className="gap-4 flex-col sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="h-16 rounded-2xl font-black text-lg px-10 order-2 sm:order-1 border-border/50 hover:bg-accentTransition duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameQuest}
              disabled={isUpdating || !newTitle.trim()}
              className="h-16 rounded-2xl font-black text-lg px-10 order-1 sm:order-2 shadow-2xl shadow-primary/20 min-w-[180px] hover:scale-105 active:scale-95 transition-all"
            >
              {isUpdating ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
