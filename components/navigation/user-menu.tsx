"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogOut, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { getSignedUrlForS3Key } from "@/lib/s3-client";

export function UserMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  // Resolve S3 key to signed URL for display
  useEffect(() => {
    async function resolve() {
      const src = session?.user?.image;
      if (src && !src.startsWith("http") && !src.startsWith("data:")) {
        try {
          const url = await getSignedUrlForS3Key(src);
          setResolvedSrc(url);
        } catch (err) {
          console.error("Failed to resolve user menu avatar:", err);
          setResolvedSrc(null);
        }
      } else {
        setResolvedSrc(src || null);
      }
    }
    resolve();
  }, [session?.user?.image]);

  if (!session) return null;

  const user = session.user;
  const initials = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={resolvedSrc || undefined} alt={user.name} />
            <AvatarFallback className="bg-muted text-muted-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 py-1">
            <p className="text-sm leading-none font-semibold">{user.name}</p>
            <p className="text-muted-foreground text-xs leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-colors"
          onClick={() => router.push("/account")}
        >
          <User className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-colors"
          onClick={() => router.push("/billing")}
        >
          <CreditCard className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
