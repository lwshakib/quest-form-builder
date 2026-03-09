"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Send,
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
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
import {
  createQuest,
  getQuests,
  updateQuest,
  deleteQuest,
} from "@/lib/actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface Quest {
  id: string;
  title: string;
  status: string;
  responses?: number;
  updatedAt: string | Date;
}

export default function QuestsPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      const questsData = await getQuests();
      setQuests(questsData);
    } catch {
      toast.error("Failed to load quests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBlankQuest = async () => {
    setIsCreating(true);
    try {
      const quest = await createQuest("Untitled Quest");
      router.push(`/quests/${quest.id}`);
    } catch {
      toast.error("Failed to create quest");
    } finally {
      setIsCreating(false);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Quests</h1>
          <p className="text-muted-foreground text-sm">Manage your forms and surveys.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/templates")} className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </Button>
          <Button onClick={handleCreateBlankQuest} disabled={isCreating} className="gap-2">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New Quest
          </Button>
        </div>
      </div>


      {/* Quests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-muted/20 border-border/50" />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-accent/5">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-1">No quests found</h3>
          <p className="text-muted-foreground text-sm mb-6">Create your first quest to get started.</p>
          <Button variant="outline" onClick={handleCreateBlankQuest}>Create Quest</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests
            .map((quest: Quest) => (
              <Card key={quest.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle 
                      className="text-lg font-semibold line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => router.push(`/quests/${quest.id}`)}
                    >
                      {quest.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={quest.status === "Published" ? "default" : "secondary"} className="h-5 text-[10px]">
                        {quest.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(quest.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => router.push(`/quests/${quest.id}`)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/share/${quest.id}`, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRenameDialog(quest)}>
                        <FileText className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      <span>{quest.responses || 0} responses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Quest</DialogTitle>
            <DialogDescription>
              Enter a new title for your quest.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Quest Title"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameQuest()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameQuest} disabled={isUpdating || !newTitle.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
