'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase();
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : getInitials(user.email || 'U');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.photoURL || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
