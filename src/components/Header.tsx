import { Logo } from '@/components/Logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
                <Logo />
            </div>
        </div>
        <div className="flex-1">
             <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        </div>
        <Button variant="outline" size="icon" asChild>
            <Link href="/login">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Çıkış Yap</span>
            </Link>
        </Button>
    </header>
  );
}
