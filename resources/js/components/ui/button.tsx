import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"
import * as React from "react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-control text-sm font-medium transition-[color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_0_0_color-mix(in_oklab,var(--primary),black_30%)] hover:bg-primary/90 active:translate-y-px active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--primary),black_30%)]",
        destructive:
          "bg-destructive text-white shadow-[0_2px_0_0_color-mix(in_oklab,var(--destructive),black_30%)] hover:bg-destructive/90 active:translate-y-px active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--destructive),black_30%)] focus-visible:ring-destructive",
        outline:
          "border border-border bg-surface text-foreground shadow-[0_2px_0_0_var(--border)] hover:bg-muted active:translate-y-px active:shadow-[0_1px_0_0_var(--border)]",
        secondary:
          "border border-border bg-surface text-foreground shadow-[0_2px_0_0_var(--border)] hover:bg-muted active:translate-y-px active:shadow-[0_1px_0_0_var(--border)]",
        success:
          "bg-success text-success-foreground shadow-[0_2px_0_0_color-mix(in_oklab,var(--success),black_30%)] hover:bg-success/90 active:translate-y-px active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--success),black_30%)]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/70",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-control px-3 has-[>svg]:px-2.5 pointer-coarse:h-touch",
        sm: "h-control-sm rounded-control px-3 has-[>svg]:px-2.5 pointer-coarse:h-touch",
        lg: "h-field rounded-control px-4 has-[>svg]:px-3 pointer-coarse:h-touch",
        icon: "size-control pointer-coarse:size-touch",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  icon: Icon,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Disables the button and shows a spinner; blocks duplicate submits. */
    loading?: boolean
    /** Leading icon; swapped for a spinner while `loading`. Label stays. */
    icon?: LucideIcon
  }) {
  const Comp = asChild ? Slot : "button"
  const leading = loading ? (
    <Spinner aria-hidden="true" />
  ) : Icon ? (
    <Icon aria-hidden="true" />
  ) : null

  // asChild: put the icon inside the child element (e.g. a Link), not beside it.
  const slotChild =
    asChild && Icon && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? React.cloneElement(
          children,
          undefined,
          leading,
          children.props.children
        )
      : children

  return (
    <Comp
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        slotChild
      ) : (
        <>
          {leading}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
