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
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  if (!session) return null;

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="border-primary/10 hover:bg-primary/5 relative h-10 w-10 rounded-full border p-0 transition-all duration-300"
        >
          <Avatar className="border-background h-9 w-9 border-2 shadow-inner">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="from-primary/80 to-primary text-primary-foreground bg-gradient-to-br font-bold">
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
          className="group flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-colors"
          onClick={() => router.push("/account")}
        >
          <div className="bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200">
            <User className="h-4 w-4" />
          </div>
          <span className="text-muted-foreground group-hover:text-foreground text-sm font-semibold transition-colors">
            Account
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="group focus:bg-destructive/5 flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-colors"
          onClick={handleLogout}
        >
          <div className="bg-muted/50 group-hover:bg-destructive/10 group-hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-muted-foreground group-hover:text-destructive text-sm font-semibold transition-colors">
            Log out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
