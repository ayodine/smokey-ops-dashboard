import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from './Button'

export interface SuccessModalDetail {
  label: string
  value: string
}

export interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  details?: SuccessModalDetail[]
  actionLabel?: string
  onAction?: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details = [],
  actionLabel = 'Done',
  onAction,
}) => {
  if (!isOpen) return null

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-kumo-base ring-1 ring-kumo-line rounded-2xl shadow-2xl overflow-hidden p-6 text-center z-10"
        >
          {/* Close Icon Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Green Checkmark Icon */}
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Title & Message */}
          <h3 className="text-[16px] font-semibold text-kumo-strong tracking-tight leading-snug">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] text-kumo-subtle tracking-normal leading-relaxed max-w-sm mx-auto">
            {message}
          </p>

          {/* Key-Value Details Summary */}
          {details.length > 0 && (
            <div className="mt-4 p-3.5 bg-kumo-surface border border-kumo-line rounded-xl text-left space-y-2 text-[13px]">
              {details.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className="text-kumo-subtle text-[12px]">{item.label}</span>
                  <span className="font-semibold text-kumo-strong font-display text-[13px]">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={handleAction}
              className="w-full h-10 px-5 rounded-xl font-semibold text-[14px] tracking-wide cursor-pointer justify-center"
            >
              {actionLabel}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default SuccessModal
