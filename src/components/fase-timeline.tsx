import { fasesServico } from "@/lib/status-styles";
import type { FaseServico } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FaseTimeline({ fase }: { fase: FaseServico }) {
  const currentIndex = fasesServico.indexOf(fase);

  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {fasesServico.map((f, i) => (
        <div key={f} className="flex items-center flex-1 min-w-[100px]">
          <div className="flex flex-col items-center gap-1.5 px-1">
            <div
              className={cn(
                "h-3 w-3 rounded-full shrink-0",
                i <= currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "text-[11px] text-center leading-tight text-muted-foreground",
                i === currentIndex && "font-semibold text-foreground"
              )}
            >
              {f}
            </span>
          </div>
          {i < fasesServico.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 -mt-4",
                i < currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
