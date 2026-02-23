"use client";

import { useState } from "react";
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
  quest: {
    id: string;
    shortId?: string;
    status?: string;
    published?: boolean;
    acceptingResponses?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedQuest: Record<string, unknown>) => void;
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
    } catch {
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
    } catch {
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
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
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
      <DialogContent className="bg-background overflow-hidden rounded-none border-none p-0 shadow-2xl sm:max-w-[450px]">
        <div className="relative">
          {/* Header Theme Gradient */}
          <div className="from-primary/40 via-primary to-primary/40 absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r" />

          <div className="space-y-8 p-8">
            <DialogHeader className="space-y-3">
              <div className="bg-primary/10 mb-2 flex h-12 w-12 items-center justify-center rounded-full">
                <Settings2 className="text-primary h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {isPublished ? "Quest is Live" : "Publish Quest"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-base leading-relaxed font-medium">
                {isPublished
                  ? "Your quest is currently active and collecting responses. You can manage access and sharing below."
                  : "Ready to share your quest with the world? Once published, anyone with the link can view and respond."}
              </DialogDescription>
            </DialogHeader>

            {!isPublished ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-border/50 bg-accent/5 hover:bg-accent/10 flex items-start gap-4 rounded-none border p-4 transition-colors">
                    <Globe className="text-primary mt-0.5 h-5 w-5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Respondents</p>
                      <p className="text-muted-foreground text-xs font-medium">
                        Anyone with the link can view and respond.
                      </p>
                    </div>
                  </div>
                  <div className="border-border/50 bg-accent/5 hover:bg-accent/10 flex items-start gap-4 rounded-none border p-4 transition-colors">
                    <BellOff className="text-muted-foreground mt-0.5 h-5 w-5" />
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-bold">Notifications</p>
                      <p className="text-muted-foreground text-xs font-medium">
                        Nobody will be notified when you publish this form.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:bg-accent/10 h-12 flex-1 rounded-none text-[10px] font-bold tracking-widest uppercase transition-all"
                    onClick={onClose}
                  >
                    Dismiss
                  </Button>
                  <Button
                    className="shadow-primary/20 h-12 flex-1 rounded-none text-[10px] font-black tracking-[0.2em] uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-95"
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
                  <Label className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
                    Share & Preview
                  </Label>
                  <div className="bg-accent/5 border-border/50 space-y-4 border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <LinkIcon className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-sm font-bold break-all">{getShareUrl()}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCopy}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="shorten"
                        checked={isShortened}
                        onCheckedChange={(checked) => setIsShortened(checked as boolean)}
                        className="border-primary/40 data-[state=checked]:bg-primary h-4 w-4 rounded-none"
                      />
                      <Label
                        htmlFor="shorten"
                        className="cursor-pointer text-xs font-bold select-none"
                      >
                        Shorten URL
                      </Label>
                    </div>

                    <Button
                      variant="outline"
                      className="border-border/60 hover:border-primary/40 hover:bg-primary/5 h-10 w-full gap-2 rounded-none transition-all"
                      asChild
                    >
                      <a href={`/share/${quest.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="mt-0.5 text-[10px] leading-none font-black tracking-widest uppercase">
                          Go to the quest
                        </span>
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="group border-border/50 bg-accent/5 flex items-center justify-between rounded-none border p-6">
                  <div className="space-y-1.5 focus-within:ring-0">
                    <Label
                      htmlFor="accept-responses"
                      className="cursor-pointer text-sm font-black tracking-tight"
                    >
                      Accepting responses
                    </Label>
                    <p className="text-muted-foreground text-xs font-medium">
                      Turn off to stop receiving new entries.
                    </p>
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
                    className="text-muted-foreground hover:bg-accent/10 h-12 rounded-none text-[10px] font-bold tracking-widest uppercase transition-all"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="shadow-primary/20 h-12 rounded-none text-[10px] font-black tracking-[0.2em] uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleUnpublish}
                    disabled={isPublishing}
                    className="border-destructive/20 text-destructive/60 hover:text-destructive hover:bg-destructive/5 col-span-2 h-10 rounded-none border text-[9px] font-black tracking-[0.2em] uppercase transition-all"
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
