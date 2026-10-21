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
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
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
      <Alert variant={variantMap[type] || 'default'} className="bg-kumo-base shadow-sm">
        {icons[type] || <ShieldCheckIcon className="w-4 h-4 text-kumo-default shrink-0" />}
        <AlertTitle>{toast.title || defaultTitles[type] || 'Notification'}</AlertTitle>
        <AlertDescription>{toast.message}</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </AlertAction>
      </Alert>
    </motion.div>
  )
}

export default ToastContainer
