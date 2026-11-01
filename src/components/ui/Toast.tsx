import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
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

/**
 * Intelligent resolver for high-context Toast title & subtitle
 * Automatically derives polished titles matching Reference Image 2
 */
function resolveToastDetails(toast: ToastMessage): { title: string; message: string } {
  const rawMessage = (toast.message || '').trim()
  const explicitTitle = (toast.title || '').trim()

  if (explicitTitle && explicitTitle !== 'Success' && explicitTitle !== 'Error' && explicitTitle !== 'Information') {
    return { title: explicitTitle, message: rawMessage }
  }

  // Infer title and clean message if standard operational patterns match
  if (rawMessage.startsWith('Access Restricted:')) {
    return {
      title: 'Access Restricted',
      message: rawMessage.replace(/^Access Restricted:\s*/, '').trim()
    }
  }

  if (rawMessage.toLowerCase().includes('saved changes for')) {
    return {
      title: 'Account Updated',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('saved staff kyc') || rawMessage.toLowerCase().includes('verified dossier')) {
    return {
      title: 'Profile & KYC Saved',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('custom scope') && rawMessage.toLowerCase().includes('created')) {
    return {
      title: 'Scope Created',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('scope policies updated') || rawMessage.toLowerCase().includes('baseline policy')) {
    return {
      title: 'Scope Policies Updated',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('switched account') || rawMessage.toLowerCase().includes('switched to')) {
    return {
      title: 'Account Switched',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('low stock') || rawMessage.toLowerCase().includes('below safety reorder')) {
    return {
      title: 'Low Stock Alert',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('batch') && (rawMessage.toLowerCase().includes('created') || rawMessage.toLowerCase().includes('scheduled'))) {
    return {
      title: 'Batch Scheduled',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('stock intake')) {
    return {
      title: 'Stock Intake Received',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('driver onboarded') || rawMessage.toLowerCase().includes('rider')) {
    return {
      title: 'Rider Profile Saved',
      message: rawMessage
    }
  }

  if (rawMessage.toLowerCase().includes('password successfully updated')) {
    return {
      title: 'Password Updated',
      message: rawMessage
    }
  }

  const type = toast.type || 'success'
  const defaultTitles: Record<string, string> = {
    success: 'Action Completed',
    error: 'Action Failed',
    info: 'System Information',
    warning: 'Operational Warning',
  }

  return {
    title: explicitTitle || defaultTitles[type] || 'Notification',
    message: rawMessage
  }
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-[420px] w-full pointer-events-none font-sans">
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
  const { title, message } = resolveToastDetails(toast)

  const borderStyles = {
    success: 'border-emerald-400/50 dark:border-emerald-500/40',
    error: 'border-red-400/50 dark:border-red-500/40',
    warning: 'border-amber-400/50 dark:border-amber-500/40',
    info: 'border-zinc-200/90 dark:border-zinc-800',
  }

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto w-full select-none"
    >
      <div
        role="alert"
        className={cn(
          "w-full rounded-2xl border bg-white dark:bg-zinc-900 shadow-md shadow-black/5 dark:shadow-black/30 p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors",
          borderStyles[type] || borderStyles.info
        )}
      >
        <div className="shrink-0">
          {icons[type] || icons.info}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[13.5px] font-semibold text-kumo-strong tracking-tight">
            {title}
          </h4>
          <p className="text-[12.5px] text-kumo-subtle mt-0.5 leading-normal">
            {message}
          </p>
        </div>

        <div className="shrink-0 self-center">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-kumo-line bg-white dark:bg-zinc-800 hover:bg-kumo-tint px-3.5 py-1.5 text-[13px] font-medium text-kumo-default shadow-2xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ToastContainer
