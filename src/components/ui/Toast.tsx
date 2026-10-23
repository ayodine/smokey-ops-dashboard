import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, ShieldCheckIcon } from 'lucide-react'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/reui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type?: 'success' | 'info' | 'error' | 'warning'
  duration?: number
}

export interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, toast.duration || 4500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const type = toast.type || 'success'

  const variantMap: Record<string, 'default' | 'destructive' | 'info' | 'success' | 'warning'> = {
    success: 'success',
    error: 'destructive',
    info: 'info',
    warning: 'warning',
  }

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
  }

  const defaultTitles: Record<string, string> = {
    success: 'Success',
    error: 'Error',
    info: 'Information',
    warning: 'Warning',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto w-full select-none shadow-lg shadow-black/10 dark:shadow-black/50"
    >
      <Alert
        variant={variantMap[type] || 'default'}
        className={cn(
          "bg-white dark:bg-zinc-900 shadow-md",
          type === 'info' && "border-zinc-200/90 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        )}
      >
        {icons[type] || <ShieldCheckIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />}
        <AlertTitle className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs tracking-tight">
          {toast.title || defaultTitles[type] || 'Notification'}
        </AlertTitle>
        <AlertDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
          {toast.message}
        </AlertDescription>
        <AlertAction>
          <Button
            variant="outline"
            size="xs"
            onClick={onDismiss}
            className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
          >
            Dismiss
          </Button>
        </AlertAction>
      </Alert>
    </motion.div>
  )
}

export default ToastContainer
