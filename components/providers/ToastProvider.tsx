'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn, generateId } from '@/lib/utils'
import type { ToastMessage } from '@/types'

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const defaultContext: ToastContextValue = {
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
}

const ToastContext = createContext<ToastContextValue>(defaultContext)

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}

const TOAST_STYLES = {
  success: 'border-l-4 border-green-500',
  error:   'border-l-4 border-red-500',
  info:    'border-l-4 border-blue-500',
  warning: 'border-l-4 border-amber-500',
}

const ICON_STYLES = {
  success: 'text-green-600',
  error:   'text-red-600',
  info:    'text-blue-600',
  warning: 'text-amber-600',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId()
    setToasts(prev => [...prev.slice(-3), { ...toast, id }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  const success = useCallback((title: string, message?: string) => showToast({ type: 'success', title, message }), [showToast])
  const error   = useCallback((title: string, message?: string) => showToast({ type: 'error',   title, message }), [showToast])
  const info    = useCallback((title: string, message?: string) => showToast({ type: 'info',    title, message }), [showToast])
  const warning = useCallback((title: string, message?: string) => showToast({ type: 'warning', title, message }), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map(toast => {
          const IconComponent = ICONS[toast.type] || Info
          return (
            <div
              key={toast.id}
              className={cn(
                'card shadow-modal p-4 flex items-start gap-3 pointer-events-auto',
                TOAST_STYLES[toast.type]
              )}
            >
              <IconComponent className={cn('w-5 h-5 mt-0.5 flex-shrink-0', ICON_STYLES[toast.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-content-muted mt-0.5">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-content-subtle hover:text-content flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
