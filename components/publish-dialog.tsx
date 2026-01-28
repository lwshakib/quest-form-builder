'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Share2, 
  Globe, 
  BellOff, 
  Link as LinkIcon, 
  Check, 
  Copy, 
  ExternalLink,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { updateQuest, publishQuest, unpublishQuest } from "@/lib/actions";

interface PublishDialogProps {
  quest: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedQuest: any) => void;
}

export function PublishDialog({ quest, isOpen, onClose, onUpdate }: PublishDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptingResponses, setAcceptingResponses] = useState(quest?.acceptingResponses ?? true);
  const [isCopied, setIsCopied] = useState(false);
  const [isShortened, setIsShortened] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const updated = await publishQuest(quest.id);
      onUpdate?.(updated);
      toast.success("Quest published successfully!");
    } catch (error) {
      toast.error("Failed to publish quest");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      const updated = await unpublishQuest(quest.id);
      onUpdate?.(updated);
      toast.success("Quest unpublished");
    } catch (error) {
      toast.error("Failed to unpublish quest");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateQuest(quest.id, { acceptingResponses });
      onUpdate?.(updated);
      toast.success("Settings saved");
      onClose();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (isShortened && quest.shortId) {
      return `${origin}/r/${quest.shortId}`;
    }
    return `${origin}/share/${quest.id}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareUrl());
    setIsCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isPublished = quest?.status === "Published" || quest?.published;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-background shadow-2xl rounded-none">
        <div className="relative">
          {/* Header Theme Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          
          <div className="p-8 space-y-8">
            <DialogHeader className="space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {isPublished ? "Quest is Live" : "Publish Quest"}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-muted-foreground/70 leading-relaxed">
                {isPublished 
                  ? "Your quest is currently active and collecting responses. You can manage access and sharing below."
                  : "Ready to share your quest with the world? Once published, anyone with the link can view and respond."}
              </DialogDescription>
            </DialogHeader>

            {!isPublished ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-none border border-border/50 bg-accent/5 transition-colors hover:bg-accent/10">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Respondents</p>
                      <p className="text-xs text-muted-foreground font-medium">Anyone with the link can view and respond.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-none border border-border/50 bg-accent/5 transition-colors hover:bg-accent/10">
                    <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-muted-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground font-medium">Nobody will be notified when you publish this form.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-none font-bold text-muted-foreground hover:bg-accent/10 transition-all uppercase tracking-widest text-[10px]"
                    onClick={onClose}
                  >
                    Dismiss
                  </Button>
                  <Button 
                    className="flex-1 h-12 rounded-none font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]"
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? "Publishing..." : "Publish Quest"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Share & Preview</Label>
                  <div className="p-3 bg-accent/5 border border-border/50 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <LinkIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm font-bold break-all">{getShareUrl()}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="shorten" 
                        checked={isShortened}
                        onCheckedChange={(checked) => setIsShortened(checked as boolean)}
                        className="rounded-none border-primary/40 data-[state=checked]:bg-primary h-4 w-4"
                      />
                      <Label htmlFor="shorten" className="text-xs font-bold cursor-pointer select-none">Shorten URL</Label>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full h-10 rounded-none border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all gap-2"
                      asChild
                    >
                      <a href={`/share/${quest.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Go to the quest</span>
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between group p-6 rounded-none border border-border/50 bg-accent/5">
                  <div className="space-y-1.5 focus-within:ring-0">
                    <Label htmlFor="accept-responses" className="font-black text-sm tracking-tight cursor-pointer">Accepting responses</Label>
                    <p className="text-xs text-muted-foreground font-medium">Turn off to stop receiving new entries.</p>
                  </div>
                  <Switch 
                    id="accept-responses"
                    checked={acceptingResponses}
                    onCheckedChange={setAcceptingResponses}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    className="h-12 rounded-none font-bold text-muted-foreground hover:bg-accent/10 transition-all uppercase tracking-widest text-[10px]"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="h-12 rounded-none font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleUnpublish}
                    disabled={isPublishing}
                    className="col-span-2 h-10 border border-destructive/20 text-destructive/60 hover:text-destructive hover:bg-destructive/5 rounded-none font-black uppercase tracking-[0.2em] text-[9px] transition-all"
                  >
                    {isPublishing ? "Processing..." : "Unpublish this Quest"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
