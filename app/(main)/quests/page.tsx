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
import { createQuest, getQuests, updateQuest, deleteQuest } from "@/lib/actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
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
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Quest
          </Button>
        </div>
      </div>

      {/* Quests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-muted/20 border-border/50 h-48 animate-pulse" />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="bg-accent/5 flex flex-col items-center justify-center rounded-lg border p-12">
          <FileText className="text-muted-foreground mb-4 h-12 w-12 opacity-20" />
          <h3 className="mb-1 text-lg font-medium">No quests found</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Create your first quest to get started.
          </p>
          <Button variant="outline" onClick={handleCreateBlankQuest}>
            Create Quest
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest: Quest) => (
            <Card key={quest.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex flex-col gap-1">
                  <CardTitle
                    className="hover:text-primary line-clamp-1 cursor-pointer text-lg font-semibold transition-colors"
                    onClick={() => router.push(`/quests/${quest.id}`)}
                  >
                    {quest.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={quest.status === "Published" ? "default" : "secondary"}
                      className="h-5 text-[10px]"
                    >
                      {quest.status}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
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
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/share/${quest.id}`, "_blank")}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openRenameDialog(quest)}>
                      <FileText className="mr-2 h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteQuest(quest.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
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
            <DialogDescription>Enter a new title for your quest.</DialogDescription>
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
