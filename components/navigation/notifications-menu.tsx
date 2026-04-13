/**
 * NotificationsMenu component provides a real-time status of new quest responses.
 * It uses a polling mechanism to periodically check for unread data and
 * provides a central hub for users to jump directly to new submissions.
 */

"use client";

import { useState, useEffect } from "react";
import { Bell, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getUnreadNotifications, markQuestResponsesAsRead } from "@/lib/actions";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  newCount: number;
  updatedAt: string | Date;
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Fetches unread response counts for all quests owned by the current user.
   */
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

  /**
   * Effect: Polling
   * Refreshes the notification count every 60 seconds to keep the UI 'alive'
   * without needing a full-page reload.
   */
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Effect: Route Change Refresh
   * Re-fetches notifications when the user navigates. Useful if they just
   * finished viewing a response page and we want the red dot to disappear immediately.
   */
  useEffect(() => {
    fetchNotifications();
  }, [pathname]);

  const totalNew = notifications.length;

  /**
   * Handles clicking a specific notification.
   * Marks the responses as 'read' in the DB before navigating to the response tab.
   */
  const handleNotificationClick = async (questId: string) => {
    setIsOpen(false);
    await markQuestResponsesAsRead(questId);

    // Optimistically update the UI by removing the item from the list
    setNotifications((prev) => prev.filter((n) => n.id !== questId));

    // Navigate to the quest detail view with the 'responses' tab pre-selected
    router.push(`/quests/${questId}?tab=responses`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary relative h-10 w-10 rounded-full transition-all active:scale-90"
        >
          {/* Subtle pulse animation when new data is available */}
          <Bell className={cn("h-5 w-5", totalNew > 0 && "animate-pulse")} />
          {totalNew > 0 && (
            <span className="bg-primary border-background absolute top-2.5 right-2.5 h-2 w-2 rounded-full border-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background/80 border-border/50 w-80 overflow-hidden rounded-2xl p-0 shadow-2xl backdrop-blur-xl"
        align="end"
        sideOffset={12}
      >
        {/* Header section with count */}
        <div className="bg-muted/20 border-border/50 flex items-center justify-between border-b p-4">
          <h3 className="text-muted-foreground/60 text-xs font-black tracking-[0.2em] uppercase">
            Notifications
          </h3>
          {totalNew > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-black uppercase">
              {totalNew} New
            </span>
          )}
        </div>

        <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-12">
              <Loader2 className="text-muted-foreground/20 h-6 w-6 animate-spin" />
              <p className="text-muted-foreground/30 text-[10px] font-black tracking-widest uppercase">
                Syncing...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            // Empty state view
            <div className="flex flex-col items-center justify-center space-y-4 px-8 py-16 text-center">
              <div className="bg-muted/30 rounded-full p-4">
                <Bell className="text-muted-foreground/20 h-8 w-8" />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">All caught up!</p>
                <p className="text-muted-foreground/30 mt-1 text-[10px] font-black tracking-widest uppercase">
                  No new responses
                </p>
              </div>
            </div>
          ) : (
            // List of quests with unread responses
            <div className="divide-border/30 divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className="hover:bg-primary/[0.02] group flex w-full items-start gap-4 p-4 text-left transition-colors"
                >
                  <div className="bg-primary/5 group-hover:bg-primary/10 border-primary/5 mt-1 rounded-xl border p-2 transition-colors">
                    <MessageSquare className="text-primary h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground group-hover:text-primary line-clamp-1 text-sm font-bold transition-colors">
                      {notification.title}
                    </p>
                    <p className="text-muted-foreground/80 mt-0.5 text-xs font-medium">
                      {notification.newCount} new {notification.newCount === 1 ? "user" : "users"}{" "}
                      responded
                    </p>
                    <p className="text-muted-foreground/40 mt-2 text-[9px] font-bold tracking-wider uppercase">
                      {formatDistanceToNow(new Date(notification.updatedAt))} ago
                    </p>
                  </div>
                  <div className="text-muted-foreground/20 group-hover:text-primary mt-1 transition-colors">
                    <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Quick link to All Quests dashboard */}
        {notifications.length > 0 && (
          <div className="bg-muted/10 border-border/50 border-t p-3 text-center">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary h-8 w-full text-[10px] font-black tracking-widest uppercase"
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
