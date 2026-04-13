"use client";

import { useEffect, useState } from "react";
import { getUserCredits } from "@/lib/actions";
import { Zap } from "lucide-react";

export function UsageText() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      const c = await getUserCredits();
      setCredits(c);
    };
    fetchCredits();
  }, []);

  return (
    <div className="bg-muted/50 hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold md:flex">
      <Zap className="text-primary h-3 w-3 fill-primary" />
      <span>{credits !== null ? `${credits} Credits` : "---"}</span>
      <span className="text-muted-foreground ml-1 border-l pl-2 uppercase tracking-tight">Free</span>
    </div>
  );
}
