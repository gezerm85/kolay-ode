'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LayoutDashboard, CreditCard, PieChart, Settings, LogOut, Menu, Users, Percent, Bolt } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from './ui/separator';

const navItems = [
    { href: "/dashboard", label: "Giriş Sayfası", icon: LayoutDashboard },
    { href: "/quick-payment", label: "Hızlı Ödeme", icon: Bolt },
    { href: "/payments", label: "Ödemeler", icon: CreditCard },
    { href: "/customers", label: "Müşteriler", icon: Users },
    { href: "/reports", label: "Finansal Özet", icon: PieChart },
];

const NavLink = ({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);


    return (
        <Link
            href={href}
            className={cn(
                "transition-colors hover:text-primary",
                isActive ? "text-primary font-semibold" : "text-muted-foreground",
                className
            )}
        >
            {children}
        </Link>
    );
};

export function TopNav({ handleLogout }: { handleLogout: () => Promise<void> }) {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                <div className="mr-6 flex items-center">
                   <Logo />
                </div>
                <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                   {navItems.map(item => (
                       <NavLink key={item.href} href={item.href}>
                           {item.label}
                       </NavLink>
                   ))}
                </nav>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Ayarlar</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Uygulama Ayarları</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/banks">Banka Ayarları</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings/installments">Taksit Ayarları</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                    </Button>
                    
                    {/* Mobile Nav */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menüyü aç</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px]">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 flex h-full flex-col">
                               <div className="px-2 mb-6">
                                 <Logo />
                               </div>
                                <nav className="grid gap-2">
                                {navItems.map(item => (
                                    <SheetClose asChild key={item.href}>
                                        <NavLink href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base hover:bg-muted">
                                            <item.icon className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium">{item.label}</span>
                                        </NavLink>
                                    </SheetClose>
                                ))}
                                 <Separator className="my-2" />
                                 <SheetClose asChild>
                                    <NavLink href="/settings/banks" className="flex items-center gap-3 rounded-lg px-3 py-3 text-base hover:bg-muted">
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">Banka Ayarları</span>
                                    </NavLink>
                                </SheetClose>
                                <SheetClose asChild>
                                    <NavLink href="/settings/installments" className="flex items-center gap-3 rounded-lg px-3 py-3 text-base hover:bg-muted">
                                        <Percent className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">Taksit Ayarları</span>
                                    </NavLink>
                                </SheetClose>

                                </nav>
                                <div className="mt-auto">
                                   <SheetClose asChild>
                                        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-base gap-3 rounded-lg px-3 py-3">
                                            <LogOut className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium">Çıkış Yap</span>
                                        </Button>
                                    </SheetClose>
                                </div>
                             </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
