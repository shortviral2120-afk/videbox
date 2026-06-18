import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L22 12L12 22L2 12L12 2Z"
          fill="#1A3A5C"
          fillOpacity="0.1"
          stroke="#1A3A5C"
          strokeWidth="1.5"
        />
        <path d="M12 2V22" stroke="#1A3A5C" strokeWidth="1.2" strokeOpacity="0.5" />
        <path d="M2 12H22" stroke="#1A3A5C" strokeWidth="1.2" strokeOpacity="0.5" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-primary">VidroBox</span>
    </div>
  );
}
