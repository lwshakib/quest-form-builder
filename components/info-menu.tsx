'use client';

import { HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export function InfoMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary rounded-full transition-all h-10 w-10 active:scale-90"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl" align="end" sideOffset={12}>
        <div className="relative p-6 overflow-hidden">
             {/* Content goes here */}
        </div>
      </PopoverContent>
    </Popover>
  );
}
