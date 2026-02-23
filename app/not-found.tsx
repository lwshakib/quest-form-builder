"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MoveLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />

      <div className="animate-in fade-in slide-in-from-bottom-10 relative max-w-md space-y-8 duration-1000">
        <div className="relative">
          <div className="bg-primary/20 absolute inset-0 rounded-full blur-3xl" />
          <div className="bg-background border-border/50 relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border shadow-2xl">
            <FileQuestion className="text-primary h-12 w-12" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter">404</h1>
          <h2 className="text-2xl font-black tracking-tight">Something is missing</h2>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            The page you&apos;re looking for doesn&apos;t exist or has been moved to another location.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            className="hover:bg-accent/5 group h-12 gap-2 rounded-none px-8 font-bold transition-all"
            asChild
          >
            <Link href="javascript:history.back()">
              <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </Link>
          </Button>
          <Button
            size="lg"
            className="shadow-primary/20 h-12 gap-2 rounded-none px-8 font-black shadow-xl transition-all hover:scale-[1.02] active:scale-98"
            asChild
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 opacity-20">
          <p className="text-[10px] font-black tracking-[0.5em] uppercase">Quest Form Builder</p>
        </div>
      </div>
    </div>
  );
}
