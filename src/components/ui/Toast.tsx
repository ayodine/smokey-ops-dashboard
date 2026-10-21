import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
}

export interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-sans">
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
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const icons = {
    success: (
      <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>
    ),
    error: (
      <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center shrink-0">
        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>
    ),
    info: (
      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
        <Info className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>
    ),
  }

  const borderStyles = {
    success: 'border-l-4 border-l-emerald-600 dark:border-l-emerald-500',
    error: 'border-l-4 border-l-rose-600 dark:border-l-rose-500',
    info: 'border-l-4 border-l-primary dark:border-l-primary',
  }

  const type = toast.type || 'success'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border border-kumo-line bg-kumo-base dark:bg-kumo-base shadow-lg shadow-black/5 dark:shadow-black/40 text-xs font-sans select-none',
        borderStyles[type]
      )}
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <div className="font-semibold text-xs text-kumo-strong tracking-tight mb-0.5">
            {toast.title}
          </div>
        )}
        <div className="text-xs text-kumo-subtle leading-relaxed break-words font-medium">
          {toast.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-fill p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1 mt-0.5"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

export default ToastContainer
