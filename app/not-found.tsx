'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, MoveLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative space-y-8 max-w-md animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
          <div className="relative h-24 w-24 mx-auto rounded-3xl bg-background border border-border/50 flex items-center justify-center shadow-2xl">
            <FileQuestion className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter">404</h1>
          <h2 className="text-2xl font-black tracking-tight">Something is missing</h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved to another location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button variant="outline" size="lg" className="h-12 rounded-none px-8 font-bold gap-2 transition-all hover:bg-accent/5 group" asChild>
            <Link href="javascript:history.back()">
              <MoveLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Link>
          </Button>
          <Button size="lg" className="h-12 rounded-none px-8 font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-98" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 opacity-20">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Quest Form Builder</p>
        </div>
      </div>
    </div>
  );
}
