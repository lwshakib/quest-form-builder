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
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg">
                   <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-black tracking-tighter">Quest</h2>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-primary/5 border-primary/10">v1.2.0</Badge>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
              The intelligent form builder designed for modern creators. Build, distribute, and analyze with speed.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
