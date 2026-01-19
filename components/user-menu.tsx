'use client';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

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
  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/10 p-0 hover:bg-primary/5 transition-all duration-300">
          <Avatar className="h-9 w-9 border-2 border-background shadow-inner">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 py-1">
            <p className="text-sm font-semibold leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-3 py-2 cursor-pointer group"
          onClick={() => router.push('/account')}
        >
          <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-3 py-2 cursor-pointer group text-destructive focus:text-destructive focus:bg-destructive/5"
          onClick={handleLogout}
        >
          <div className="p-1.5 rounded-full bg-destructive/10 group-hover:bg-destructive group-hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
