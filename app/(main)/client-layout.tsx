'use client'

import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ArrowLeft, 
  Play, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  MessageSquare, 
  Settings,
  Settings2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { getQuestById, updateQuest } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PublishDialog } from "@/components/publish-dialog";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'questions';
  
  const [quest, setQuest] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [origin, setOrigin] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isEditor = pathname.startsWith('/quests/') && params.id && !pathname.endsWith('/responses') && !pathname.endsWith('/settings');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (quest?.title) {
      setEditedTitle(quest.title);
    }
  }, [quest?.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = async () => {
    if (!editedTitle.trim() || editedTitle === quest?.title) {
      setIsEditingTitle(false);
      setEditedTitle(quest?.title || "");
      return;
    }

    try {
      const updated = await updateQuest(params.id as string, { title: editedTitle });
      setQuest(updated);
      setIsEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
      setEditedTitle(quest?.title || "");
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(quest?.title || "");
    }
  };

  useEffect(() => {
    if (isEditor && params.id) {
      const loadQuest = async () => {
        try {
          const data = await getQuestById(params.id as string);
          setQuest(data);
        } catch (error) {
          console.error("Failed to load quest for header", error);
        }
      };
      loadQuest();

      // Listen for updates from the page content (e.g. title changes)
      const handleUpdate = (e: any) => {
        if (e.detail) {
          setQuest(e.detail);
          setEditedTitle(e.detail.title || "");
        }
      };

      window.addEventListener('quest-updated', handleUpdate);
      return () => window.removeEventListener('quest-updated', handleUpdate);
    }
  }, [isEditor, params.id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${params.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTabChange = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {isEditor ? (
            // Editor Header
            <>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-full h-9 w-9">
                  <Link href="/quests">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="hidden sm:flex flex-col">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={handleTitleSubmit}
                      onKeyDown={handleTitleKeyDown}
                      className="font-bold text-sm bg-transparent border-none p-0 m-0 outline-none focus:ring-0 w-full min-w-[200px]"
                    />
                  ) : (
                    <span 
                      className="font-bold text-sm line-clamp-1 max-w-[120px] md:max-w-[200px] cursor-pointer transition-all hover:text-primary flex items-center gap-2 group"
                      onClick={() => setIsEditingTitle(true)}
                      title="Click to edit quest title"
                    >
                      {quest?.title || "Loading..."}
                      <Settings2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </span>
                  )}
                </div>
              </div>

              {/* Header Tabs - Icon only as requested */}
              <div className="flex bg-muted/30 p-1 rounded-full border border-primary/5">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeTab === 'questions' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className={cn("h-8 w-12 rounded-full transition-all", activeTab === 'questions' && "shadow-sm")}
                        onClick={() => handleTabChange('questions')}
                      >
                        <FileText className={cn("h-4 w-4 transition-colors", activeTab === 'questions' ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Questions</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeTab === 'responses' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className={cn("h-8 w-12 rounded-full transition-all", activeTab === 'responses' && "shadow-sm")}
                        onClick={() => handleTabChange('responses')}
                      >
                        <MessageSquare className={cn("h-4 w-4 transition-colors", activeTab === 'responses' ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Responses</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className={cn("h-8 w-12 rounded-full transition-all", activeTab === 'settings' && "shadow-sm")}
                        onClick={() => handleTabChange('settings')}
                      >
                        <Settings className={cn("h-4 w-4 transition-colors", activeTab === 'settings' ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Settings</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-1.5">
                <TooltipProvider delayDuration={0}>
                   <ModeToggle />
                   
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <Link href={`/share/${params.id}`} target="_blank">
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Preview</p></TooltipContent>
                  </Tooltip>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Share Quest</p></TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-[380px] p-6 rounded-none bg-background shadow-2xl border-border/50" side="bottom" align="end" sideOffset={12}>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Shareable Link</Label>
                          <div className="flex gap-2">
                            <Input 
                              readOnly 
                              value={`${origin}/share/${params.id}`} 
                              className="h-10 rounded-none bg-muted/30 border-none font-medium text-xs focus-visible:ring-0" 
                            />
                            <Button size="icon" className="h-10 w-10 shrink-0 rounded-none shadow-md" onClick={handleCopyLink}>
                              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-none bg-accent/5 border border-border/30">
                          <Checkbox 
                            id="shorten-header" 
                            className="rounded-none border-primary/40 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor="shorten-header" className="text-xs font-bold cursor-pointer select-none">Shorten URL (r/{params.id?.toString().substring(0,6)})</Label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className={cn(
                          "h-9 px-4 shadow-lg rounded-full transition-all active:scale-95 gap-2",
                          quest?.status === "Published" 
                            ? "bg-green-500 hover:bg-green-600 shadow-green-500/20 text-white" 
                            : "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                        )}
                        onClick={() => setIsPublishOpen(true)}
                      >
                        {quest?.status === "Published" ? (
                          <>
                            <div className="relative">
                              <Settings2 className="h-4 w-4" />
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Config</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Publish</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {quest?.status === "Published" ? "Manage published quest" : "Share your quest"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-px h-6 bg-border mx-1.5 hidden xs:block" />
                <UserMenu />
              </div>
            </>
          ) : (
            // Dashboard Header
            <>
              <div className="flex items-center gap-8">
                <Link href="/quests" className="flex items-center space-x-2 transition-transform hover:scale-105">
                  <Logo />
                </Link>
              </div>

              <div className="flex flex-1 items-center justify-center px-6 max-w-xl hidden lg:flex">
                <div className="relative w-full group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Find anything..." 
                    className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-full h-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <ModeToggle />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full transition-all h-10 w-10">
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative rounded-full transition-all h-10 w-10">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
                
                <UserMenu />
              </div>
            </>
          )}
        </div>
      </header>
      
      <main className="flex-1 relative">
        {children}
      </main>

      {isEditor && quest && (
        <PublishDialog 
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          quest={quest}
          onUpdate={(updatedQuest) => setQuest(updatedQuest)}
        />
      )}
    </div>
  );
}
