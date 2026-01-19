'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createQuest, getQuests, updateQuest, deleteQuest } from '@/lib/actions';
import { toast } from 'sonner';

export default function QuestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadQuests = async () => {
    try {
      const data = await getQuests();
      setQuests(data);
    } catch (error) {
      toast.error("Failed to load quests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const handleCreateBlankQuest = async () => {
    setIsCreating(true);
    try {
      const quest = await createQuest("Untitled Quest");
      router.push(`/quests/${quest.id}`);
    } catch (error) {
      toast.error("Failed to create quest");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    toast.promise(deleteQuest(id), {
      loading: 'Deleting quest...',
      success: () => {
        setQuests(quests.filter(q => q.id !== id));
        return 'Quest deleted successfully';
      },
      error: 'Failed to delete quest',
    });
  };

  const handleRenameQuest = async () => {
    if (!selectedQuest || !newTitle.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateQuest(selectedQuest.id, { title: newTitle });
      setQuests(quests.map(q => q.id === selectedQuest.id ? { ...q, title: newTitle } : q));
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
    <div className="container mx-auto py-10 space-y-12 animate-in fade-in duration-1000 px-4 lg:px-8">
      {/* Hero Section / Create Section */}
      <section className="space-y-10">
        <div className="flex flex-col items-center sm:items-start space-y-2">
          <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm">
            Workspace
          </Badge>
          <h1 className="text-4xl font-black tracking-tighter lg:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 text-center sm:text-left drop-shadow-sm">
            Start a new Quest
          </h1>
          <p className="text-xl text-muted-foreground/80 max-w-lg text-center sm:text-left font-medium">
            Launch your next project with a blank canvas or professional template.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button 
            disabled={isCreating}
            onClick={handleCreateBlankQuest}
            className="group relative flex flex-col items-center justify-center h-56 bg-card/40 border-2 border-dashed border-border rounded-3xl transition-all duration-500 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] shadow-sm hover:shadow-xl overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-primary/5 p-4 rounded-full mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-primary/10">
              {isCreating ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Plus className="h-8 w-8 text-primary" />}
            </div>
            <span className="font-bold text-xl tracking-tight">Blank Quest</span>
            <span className="text-xs text-muted-foreground mt-1 font-medium opacity-60">Start from scratch</span>
          </button>

          {[
            { title: 'Feedback', desc: 'Customer insights', icon: MessageSquare },
            { title: 'Survey', desc: 'Market research', icon: FileText },
            { title: 'Quiz', desc: 'Knowledge test', icon: Sparkles }
          ].map((temp) => (
            <div key={temp.title} className="group relative flex flex-col items-center justify-center h-56 bg-card/20 border border-border/40 rounded-3xl transition-all duration-500 opacity-40 grayscale">
               <div className="bg-muted p-4 rounded-full mb-4 border border-border">
                <temp.icon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <span className="font-bold text-lg tracking-tight">{temp.title}</span>
              <span className="text-xs text-muted-foreground/60 mt-1 px-4 text-center font-medium">{temp.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quests List */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/30 pb-10">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-3xl font-black tracking-tighter">Your Library</h2>
            <p className="text-muted-foreground text-sm font-medium opacity-80">Manage and monitor all your active quests.</p>
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
            <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-xl hover:bg-card border-border shadow-sm">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-accent/10 animate-pulse" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-32 bg-accent/5 border-2 border-dashed border-border rounded-[4rem] text-center animate-in zoom-in-95 duration-700">
            <div className="p-8 bg-primary/5 rounded-full mb-8 shadow-2xl shadow-primary/5 border border-primary/10">
              <FileText className="h-16 w-16 text-primary/30" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tighter">Your library is empty</h3>
              <p className="text-muted-foreground max-w-sm text-lg font-medium opacity-80">
                Create your first quest to start collecting meaningful insights from your audience.
              </p>
            </div>
            <Button className="mt-12 h-16 rounded-full px-12 text-xl font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all" onClick={handleCreateBlankQuest}>
              Create Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {quests
              .filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
              .map((quest) => (
              <div key={quest.id} className="group relative overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 bg-card/10 backdrop-blur-xl rounded-3xl hover:border-primary/30 flex flex-col h-72">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10 opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="p-6 pb-4 flex justify-between items-start z-10">
                  <div className="bg-primary/5 p-3 rounded-xl shadow-inner group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-primary/5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={quest.status === 'Active' ? 'default' : 'secondary'} className="rounded-full px-3 py-1 text-[8px] font-black tracking-tight uppercase">
                      {quest.status}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/20 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl border border-border/50 shadow-2xl backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => router.push(`/quests/${quest.id}`)} className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium">
                           <Edit2 className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/share/${quest.id}`, '_blank')} className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium">
                           <ExternalLink className="h-3.5 w-3.5" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameDialog(quest)} className="gap-2 rounded-lg h-9 cursor-pointer text-sm font-medium">
                           <Edit2 className="h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem onClick={() => handleDeleteQuest(quest.id)} className="text-destructive focus:text-white focus:bg-destructive gap-2 rounded-lg h-9 cursor-pointer text-sm font-bold transition-colors">
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
                    <span>{new Date(quest.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-5 mt-auto border-t border-border/5 bg-accent/5">
                  <Button variant="ghost" className="w-full justify-between h-9 rounded-lg px-3 group/btn text-xs font-black uppercase tracking-widest text-primary/70 hover:text-primary hover:bg-transparent" onClick={() => router.push(`/quests/${quest.id}`)}>
                    Open Quest <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
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
            <DialogTitle className="text-4xl font-black tracking-tighter">Rename Quest</DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground/80 font-medium leading-relaxed">
              Updating your quest name will help you stay organized in your library.
            </DialogDescription>
          </DialogHeader>
          <div className="py-10">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 2024 Product Roadmap"
              className="h-20 bg-accent/20 border-none focus-visible:ring-4 focus-visible:ring-primary/10 rounded-2xl text-2xl font-black px-8 shadow-inner transition-all placeholder:text-muted-foreground/20"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRenameQuest()}
            />
          </div>
          <DialogFooter className="gap-4 flex-col sm:flex-row">
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)} className="h-16 rounded-2xl font-black text-lg px-10 order-2 sm:order-1 border-border/50 hover:bg-accentTransition duration-300">Cancel</Button>
            <Button onClick={handleRenameQuest} disabled={isUpdating || !newTitle.trim()} className="h-16 rounded-2xl font-black text-lg px-10 order-1 sm:order-2 shadow-2xl shadow-primary/20 min-w-[180px] hover:scale-105 active:scale-95 transition-all">
              {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
