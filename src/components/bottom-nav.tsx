"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { primaryNavItems, moreNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreNavItems.some((item) => item.href === pathname);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card">
        <div className="grid grid-cols-5">
          {primaryNavItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
                <span className="truncate px-0.5">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
              moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="truncate px-0.5">Mais</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="bottom-0 top-auto translate-y-0 left-0 right-0 translate-x-0 max-w-full rounded-t-xl rounded-b-none sm:rounded-t-xl sm:max-w-full data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0">
          <DialogHeader>
            <DialogTitle>Mais opções</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pb-2">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-lg border p-4 text-xs font-medium hover:bg-accent transition-colors",
                    active ? "text-primary border-primary/40" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
