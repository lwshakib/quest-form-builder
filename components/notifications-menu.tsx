"use client";

import { useState, useEffect } from "react";
import { Bell, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getUnreadNotifications,
  markQuestResponsesAsRead,
} from "@/lib/actions";
import { useRouter, usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Also refresh when pathname changes (e.g. user leaves a quest response page)
  useEffect(() => {
    fetchNotifications();
  }, [pathname]);

  const totalNew = notifications.length;

  const handleNotificationClick = async (questId: string) => {
    setIsOpen(false);
    await markQuestResponsesAsRead(questId);
    // Refresh list locally
    setNotifications((prev) => prev.filter((n) => n.id !== questId));
    router.push(`/quests/${questId}?tab=responses`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary relative rounded-full transition-all h-10 w-10 active:scale-90"
        >
          <Bell className={cn("h-5 w-5", totalNew > 0 && "animate-pulse")} />
          {totalNew > 0 && (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl"
        align="end"
        sideOffset={12}
      >
        <div className="p-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Notifications
          </h3>
          {totalNew > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">
              {totalNew} New
            </span>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/30">
                Syncing...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4">
              <div className="p-4 bg-muted/30 rounded-full">
                <Bell className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">
                  All caught up!
                </p>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/30 mt-1">
                  No new responses
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className="w-full p-4 text-left hover:bg-primary/[0.02] transition-colors group flex items-start gap-4"
                >
                  <div className="mt-1 bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors border border-primary/5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-medium mt-0.5">
                      {notification.newCount} new{" "}
                      {notification.newCount === 1 ? "user" : "users"} responded
                    </p>
                    <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider mt-2">
                      {formatDistanceToNow(new Date(notification.updatedAt))}{" "}
                      ago
                    </p>
                  </div>
                  <div className="mt-1 text-muted-foreground/20 group-hover:text-primary transition-colors">
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 bg-muted/10 border-t border-border/50 text-center">
            <Button
              variant="ghost"
              className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
              onClick={() => router.push("/quests")}
            >
              View all quests
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
