"use client";

import { HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export function InfoMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary h-10 w-10 rounded-full transition-all active:scale-90"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background/80 border-border/50 w-80 overflow-hidden rounded-2xl p-0 shadow-2xl backdrop-blur-xl"
        align="end"
        sideOffset={12}
      >
        <div className="relative overflow-hidden p-6">
          {/* Background Gradient */}
          <div className="bg-primary/10 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary rounded-lg p-1.5">
                  <Sparkles className="text-primary-foreground h-4 w-4" />
                </div>
                <h2 className="text-xl font-black tracking-tighter">Quest</h2>
              </div>
              <Badge
                variant="outline"
                className="bg-primary/5 border-primary/10 text-[10px] font-black tracking-widest uppercase"
              >
                v1.2.0
              </Badge>
            </div>

            <p className="text-muted-foreground/80 text-sm leading-relaxed font-medium">
              The intelligent form builder designed for modern creators. Build, distribute, and
              analyze with speed.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
