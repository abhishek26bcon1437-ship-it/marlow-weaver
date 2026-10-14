export type ToastTone = 'success' | 'warn' | 'info'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} type="button" className={`toast toast--${toast.tone}`} onClick={() => onDismiss(toast.id)}>
          <span className="toast__dot" aria-hidden="true" />
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  )
}
