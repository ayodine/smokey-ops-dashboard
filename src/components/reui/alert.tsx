import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "relative w-full text-xs font-sans border grid gap-y-1 items-center [&>svg:not([class*=size-])]:size-4.5",
    "has-[>svg]:grid-cols-[auto_1fr_auto] grid-cols-[1fr_auto] has-[>svg]:gap-x-3 gap-x-2",
    "has-[>[data-slot=alert-title]+[data-slot=alert-description]]:[&_[data-slot=alert-action]]:sm:row-end-3",
    "has-[>[data-slot=alert-title]+[data-slot=alert-description]]:items-start",
    "has-[>[data-slot=alert-title]+[data-slot=alert-description]]:[&_svg]:translate-y-0.5",
    "rounded-xl",
    "p-3.5",
  ],
  {
    variants: {
      variant: {
        default: "bg-kumo-base text-kumo-default border-kumo-line shadow-xs",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 [&>svg]:text-red-600 dark:[&>svg]:text-red-400",
        info:
          "border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850/60 text-zinc-900 dark:text-zinc-100 [&>svg]:text-zinc-500 dark:[&>svg]:text-zinc-400",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 [&>svg]:text-emerald-500",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 [&>svg]:text-amber-500",
        invert:
          "border-zinc-800 bg-zinc-900 text-zinc-50 [&_[data-slot=alert-description]]:text-zinc-400 [&>svg]:text-zinc-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold text-xs tracking-tight text-kumo-strong",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-kumo-subtle col-start-2 grid justify-items-start gap-1 text-xs [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "flex items-center gap-1.5 max-sm:col-start-2 max-sm:mt-2 max-sm:justify-start sm:col-start-3 sm:row-start-1 sm:justify-end sm:self-center shrink-0 ml-auto",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }

import { ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pattern({ onDismiss }: { onDismiss?: () => void } = {}) {
  return (
    <Alert>
      <ShieldCheckIcon />
      <AlertTitle>Security Update</AlertTitle>
      <AlertDescription>Update your password and enable 2FA.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="xs" onClick={onDismiss}>
          Dismiss
        </Button>
      </AlertAction>
    </Alert>
  )
}

