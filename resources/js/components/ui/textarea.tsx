import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border dark:border-input shadow-xs placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-control border bg-surface px-3 py-2 text-sm transition-[color,box-shadow,border-color] duration-150 outline-none focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-ring/60",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
