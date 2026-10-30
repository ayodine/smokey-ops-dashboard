import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface UnitInputProps {
  label?: string
  value: number | string
  onChangeValue?: (val: number) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  unit: string
  onChangeUnit?: (unit: string) => void
  unitOptions?: string[]
  min?: number
  max?: number
  step?: string | number
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  helperText?: string
}

const DEFAULT_UNITS = [
  'kg',
  'g',
  'units',
  'packs',
  'portions',
  'liters',
  'ml',
  'boxes',
  'rolls',
  'pcs',
  'bags'
]

export const UnitInput: React.FC<UnitInputProps> = ({
  label,
  value,
  onChangeValue,
  onChange,
  unit,
  onChangeUnit,
  unitOptions = DEFAULT_UNITS,
  min = 0,
  max,
  step = 'any',
  placeholder = '0.0',
  required = false,
  className,
  disabled = false,
  helperText,
}) => {
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
  const [isManualUnit, setIsManualUnit] = useState(false)
  const [manualUnitText, setManualUnitText] = useState(unit)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 140,
    openUp: false,
  })

  const buttonRef = useRef<HTMLButtonElement>(null)

  // Update dropdown position when opened
  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuHeight = 220
    const menuWidth = 140
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight

    const top = openUp ? rect.top - menuHeight - 4 : rect.bottom + 4
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))

    setDropdownPosition({
      top,
      left,
      width: menuWidth,
      openUp,
    })
  }

  useEffect(() => {
    if (isUnitDropdownOpen) {
      updatePosition()
      const handleScroll = () => {
        updatePosition()
      }
      const handleResize = () => {
        updatePosition()
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsUnitDropdownOpen(false)
      }

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isUnitDropdownOpen])

  const handleSelectUnit = (selected: string) => {
    if (selected === '__custom__') {
      setIsManualUnit(true)
    } else {
      setIsManualUnit(false)
      onChangeUnit?.(selected)
    }
    setIsUnitDropdownOpen(false)
  }

  const handleManualUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setManualUnitText(val)
    onChangeUnit?.(val)
  }

  return (
    <div className={cn('space-y-1.5 font-sans w-full min-w-0', className)}>
      {label && (
        <label className="block text-[12px] font-semibold text-kumo-strong leading-4">
          {label}
          {required && <span className="text-kumo-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center rounded-lg border border-kumo-line bg-kumo-base overflow-visible h-10 shadow-2xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all w-full min-w-0">
        {/* Numeric Quantity Input */}
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value === 0 && placeholder ? '' : value}
          onChange={(e) => {
            onChangeValue?.(Number(e.target.value))
            onChange?.(e)
          }}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className="flex-1 min-w-0 h-full px-3 text-sm sm:text-base font-sans text-kumo-strong bg-transparent focus:outline-none placeholder:text-kumo-subtle/50"
        />

        {/* Attached Unit Addon on the Right */}
        <div className="h-full flex items-center shrink-0 border-l border-kumo-line bg-kumo-tint/60 relative">
          {onChangeUnit ? (
            isManualUnit ? (
              <div className="flex items-center px-1.5 h-full">
                <input
                  type="text"
                  value={manualUnitText}
                  onChange={handleManualUnitChange}
                  placeholder="unit"
                  className="w-16 sm:w-20 h-8 px-2 text-sm text-kumo-strong bg-kumo-base border border-kumo-line rounded focus:outline-none focus:ring-1 focus:ring-primary lowercase"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsManualUnit(false)}
                  className="ml-1 text-xs text-kumo-subtle hover:text-kumo-strong cursor-pointer p-0.5"
                  title="Choose from list"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative h-full flex items-center">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => {
                    updatePosition()
                    setIsUnitDropdownOpen(prev => !prev)
                  }}
                  className="h-full px-2.5 flex items-center gap-1 text-[13px] font-medium text-kumo-default hover:text-kumo-strong hover:bg-kumo-tint transition-colors cursor-pointer select-none lowercase"
                >
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">{unit || 'unit'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                </button>

                {/* React Portal Dropdown to prevent ANY modal clipping */}
                {isUnitDropdownOpen && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[9998] cursor-default"
                      onClick={() => setIsUnitDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                      }}
                      className="z-[9999] max-h-52 overflow-y-auto rounded-lg border border-kumo-line bg-kumo-base shadow-2xl py-1 text-sm font-sans animate-in fade-in zoom-in-95"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-kumo-subtle border-b border-kumo-line/60">
                        Select Unit
                      </div>
                      {unitOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectUnit(opt)}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-kumo-tint flex items-center justify-between cursor-pointer capitalize',
                            unit.toLowerCase() === opt.toLowerCase() && 'bg-primary/10 text-primary font-semibold'
                          )}
                        >
                          <span className="truncate">{opt}</span>
                          {unit.toLowerCase() === opt.toLowerCase() && <span className="text-primary text-xs shrink-0 ml-1">✓</span>}
                        </button>
                      ))}
                      <div className="border-t border-kumo-line/60 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectUnit('__custom__')}
                          className="w-full px-3 py-2 text-left text-[13px] text-primary hover:bg-primary/10 font-medium cursor-pointer"
                        >
                          + Type manual unit...
                        </button>
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            )
          ) : (
            <span className="px-3 h-full flex items-center text-[13px] font-medium text-kumo-subtle select-none lowercase">
              {unit}
            </span>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[13px] text-kumo-subtle mt-0.5">{helperText}</p>
      )}
    </div>
  )
}
export default UnitInput
