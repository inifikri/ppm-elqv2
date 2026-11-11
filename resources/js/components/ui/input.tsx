import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  icon: Icon,
  trailing,
  ...props
}: React.ComponentProps<"input"> & {
  /** Leading icon (decorative, 16px). Turns primary on focus-within. */
  icon?: LucideIcon
  /** Trailing control, e.g. a show/hide password button. */
  trailing?: React.ReactNode
}) {
  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border dark:border-input shadow-xs file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-field pointer-coarse:h-touch w-full min-w-0 rounded-control border bg-surface px-3 py-1 text-sm transition-[color,box-shadow,border-color] duration-150 outline-none focus:outline-none focus-visible:outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-ring/60",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        Icon && "pl-9",
        trailing && "pr-10",
        className
      )}
      {...props}
    />
  )

  if (!Icon && !trailing) {
    return input
  }

  return (
    <div className="group relative w-full">
      {Icon && (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
        />
      )}
      {input}
      {trailing && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          {trailing}
        </div>
      )}
    </div>
  )
}

export { Input }
