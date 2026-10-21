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
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  }

  const borderStyles = {
    success: 'border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200',
    error: 'border-red-500/30 bg-red-50/95 dark:bg-red-950/90 text-red-900 dark:text-red-200',
    info: 'border-blue-500/30 bg-blue-50/95 dark:bg-blue-950/90 text-blue-900 dark:text-blue-200',
  }

  const type = toast.type || 'success'

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-sans',
        borderStyles[type]
      )}
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold text-xs mb-0.5">{toast.title}</div>}
        <div className="text-xs leading-relaxed opacity-90">{toast.message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="text-kumo-subtle hover:text-kumo-strong p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

export default ToastContainer
