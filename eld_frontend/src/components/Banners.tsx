import { TriangleAlert, X, CheckCircle2, Info } from 'lucide-react'

interface Props {
  kind: 'error' | 'warning' | 'info' | 'success'
  message: string
  onDismiss?: () => void
}

const KIND_STYLES = {
  error: { bg: 'bg-warning/5', border: 'border-warning/20', text: 'text-warning', icon: TriangleAlert },
  warning: { bg: 'bg-amber/5', border: 'border-amber/20', text: 'text-amber-dark', icon: TriangleAlert },
  info: { bg: 'bg-steel/5', border: 'border-steel/20', text: 'text-steel', icon: Info },
  success: { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', icon: CheckCircle2 },
}

export function ComplianceBanner({ kind, message, onDismiss }: Props) {
  const s = KIND_STYLES[kind]
  const Icon = s.icon
  return (
    <div className={`flex items-start gap-3 ${s.bg} border-y ${s.border} px-6 py-3`}>
      <Icon className={`w-5 h-5 ${s.text} flex-shrink-0 mt-0.5`} strokeWidth={1.75} />
      <div className={`flex-1 text-sm ${s.text}`}>
        <span className="font-semibold uppercase tracking-wide mr-2">
          {kind === 'error' ? 'Planning Error:' : kind === 'warning' ? 'HOS Advisory:' : kind === 'info' ? 'Info:' : 'Compliant:'}
        </span>
        {message}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
