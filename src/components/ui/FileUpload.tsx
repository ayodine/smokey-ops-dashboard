import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  UploadCloud,
  X,
  Check,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BorderBeam } from './BorderBeam'

export type FileUploadItem = {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export type AcceptedFileType = {
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface FileUploadProps {
  value?: string // Existing image URL or data URI
  onChange?: (url: string) => void
  accept?: string
  acceptedFileTypes?: AcceptedFileType[]
  browseLabel?: string
  className?: string
  description?: string
  draggingLabel?: string
  multiple?: boolean
  showBorderBeam?: boolean
  showFileList?: boolean
  title?: string
  fileReadyText?: string
  onFilesAccepted?: (files: File[]) => void
  onFilesChange?: (files: FileUploadItem[]) => void
}

const DEFAULT_ACCEPTED_TYPES: AcceptedFileType[] = [
  { label: 'Image', icon: ImageIcon },
  { label: 'PDF', icon: FileText },
  { label: 'Sheet', icon: FileSpreadsheet },
]

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp'

const ICON_TRANSFORMS = [
  {
    idle: 'translate(-78%, -50%) rotate(-8deg)',
    active: 'translate(-114%, -50%) rotate(-12deg) scale(1.08)',
  },
  {
    idle: 'translate(-50%, -50%) rotate(0deg)',
    active: 'translate(-50%, -50%) rotate(0deg) scale(1.18)',
  },
  {
    idle: 'translate(-22%, -50%) rotate(8deg)',
    active: 'translate(14%, -50%) rotate(12deg) scale(1.08)',
  },
]

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  return accept.split(',').some((rawToken) => {
    const token = rawToken.trim().toLowerCase()
    if (!token) return false
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token)
    if (token.endsWith('/*')) {
      return file.type.toLowerCase().startsWith(token.slice(0, -1))
    }
    return file.type.toLowerCase() === token
  })
}

function UploadIconCluster({
  acceptedFileTypes,
  isDragging,
}: {
  acceptedFileTypes: AcceptedFileType[]
  isDragging: boolean
}) {
  const singleIcon = acceptedFileTypes.length === 1

  return (
    <div className="relative h-14 w-36 select-none">
      {acceptedFileTypes.map((item, index) => {
        const IconComponent = item.icon
        return (
          <div
            key={item.label}
            className={cn(
              'absolute top-1/2 left-1/2 grid size-12 place-items-center rounded-2xl bg-kumo-base text-kumo-subtle border border-kumo-line shadow-sm transition-[transform,color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              'motion-reduce:transition-none',
              index === 1 && 'z-10 bg-kumo-base shadow-md',
              isDragging && 'bg-kumo-canvas text-kumo-brand border-kumo-brand/40 shadow-lg'
            )}
            style={{
              transform: singleIcon
                ? `translate(-50%, -50%) scale(${isDragging ? 1.14 : 1})`
                : isDragging
                ? ICON_TRANSFORMS[index]?.active
                : ICON_TRANSFORMS[index]?.idle,
            }}
          >
            <IconComponent className="size-5" />
          </div>
        )
      })}
    </div>
  )
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  browseLabel = 'Browse files',
  className,
  description = 'PNG, JPG, or WEBP up to 5MB',
  draggingLabel = 'Drop to add',
  multiple = false,
  showBorderBeam = true,
  showFileList = true,
  title = 'Click to upload or drop files',
  fileReadyText = 'Ready for menu display',
  onFilesAccepted,
  onFilesChange,
}) => {
  const dragDepthRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null)

  // Sync initial value as an item if provided
  useEffect(() => {
    if (value && files.length === 0) {
      setFiles([
        {
          id: 'initial-photo',
          name: value.split('/').pop()?.split('?')[0] || 'product-image.png',
          type: 'image/png',
          size: 0,
          url: value,
        },
      ])
    }
  }, [value])

  const commitFiles = useCallback(
    (nextFiles: FileList | File[]) => {
      const acceptedFiles = Array.from(nextFiles)
        .filter((file) => matchesAccept(file, accept))
        .slice(0, multiple ? undefined : 1)

      if (acceptedFiles.length === 0) {
        setRejectionMessage('This file type is not supported. Please upload an image.')
        return
      }

      setRejectionMessage(null)
      onFilesAccepted?.(acceptedFiles)

      const file = acceptedFiles[0]
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const newItems: FileUploadItem[] = acceptedFiles.map((f, i) => ({
          id: `${f.name}-${f.size}-${f.lastModified}-${i}`,
          name: f.name,
          type: f.type || 'image/png',
          size: f.size,
          url: i === 0 ? dataUrl : URL.createObjectURL(f),
        }))

        setFiles(newItems)
        onFilesChange?.(newItems)
        onChange?.(dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [accept, multiple, onFilesAccepted, onFilesChange, onChange]
  )

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleRemoveFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setFiles([])
    onChange?.('')
  }

  const dropzone = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3.5 overflow-hidden rounded-2xl border-2 border-dashed bg-kumo-base px-6 py-8 text-center transition-[border-color,background-color] duration-200 ease-out select-none',
        'motion-reduce:transition-none',
        isDragging
          ? 'border-kumo-brand bg-kumo-canvas/70'
          : 'border-kumo-line hover:border-kumo-strong/40 hover:bg-kumo-canvas/30'
      )}
      onClick={openFileDialog}
      onDragEnter={(event) => {
        event.preventDefault()
        dragDepthRef.current += 1
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0) setIsDragging(false)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        dragDepthRef.current = 0
        setIsDragging(false)
        if (event.dataTransfer.files.length > 0) {
          commitFiles(event.dataTransfer.files)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openFileDialog()
        }
      }}
    >
      <UploadIconCluster
        acceptedFileTypes={acceptedFileTypes}
        isDragging={isDragging}
      />
      <div className="space-y-1">
        <div className="text-[14px] font-semibold text-kumo-strong">{title}</div>
        <div className="text-[12px] text-kumo-subtle">{description}</div>
        {rejectionMessage && (
          <div className="text-[12px] text-kumo-danger font-medium">{rejectionMessage}</div>
        )}
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-kumo-line bg-kumo-base px-3.5 py-1 text-[12px] font-medium text-kumo-default shadow-2xs hover:bg-kumo-tint transition-colors">
        <UploadCloud className="size-3.5 text-kumo-brand" />
        <span>{isDragging ? draggingLabel : browseLabel}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            commitFiles(event.target.files)
            event.currentTarget.value = ''
          }
        }}
      />
    </div>
  )

  return (
    <div className={cn('space-y-3 font-sans', className)}>
      {showBorderBeam ? (
        <BorderBeam
          active={isDragging}
          borderRadius={18}
          colorFrom="#c0201f"
          colorTo="#f6821f"
          duration={8}
          size="md"
        >
          {dropzone}
        </BorderBeam>
      ) : (
        dropzone
      )}

      {showFileList && files.length > 0 && (
        <div className="rounded-xl border border-kumo-line bg-kumo-base overflow-hidden shadow-2xs divide-y divide-kumo-line">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 hover:bg-kumo-canvas/30 transition-colors"
            >
              <div className="size-11 shrink-0 rounded-lg border border-kumo-line bg-kumo-canvas overflow-hidden flex items-center justify-center relative">
                {file.url ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = 'none'
                      const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement
                      if (fb) fb.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={cn('w-full h-full items-center justify-center text-kumo-subtle', file.url ? 'hidden' : 'flex')}>
                  <Package className="w-5 h-5 opacity-40" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-kumo-strong">{file.name}</div>
                <div className="truncate text-[11px] text-kumo-subtle mt-0.5">
                  {file.size > 0 ? `${formatBytes(file.size)} • ` : ''}{fileReadyText}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
                  <Check className="size-3" />
                  <span>Ready</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRemoveFile(e, file.id)}
                  className="w-7 h-7 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-danger transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
