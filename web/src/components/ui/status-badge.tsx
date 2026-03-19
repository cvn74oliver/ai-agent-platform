type StatusBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

type StatusBadgeProps = {
  label: string
  tone?: StatusBadgeTone
  className?: string
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function statusBadgeClassName(tone: StatusBadgeTone = 'neutral', className?: string) {
  return joinClasses(
    'app-status-badge',
    tone === 'neutral' && 'app-status-badge-neutral',
    tone === 'accent' && 'app-status-badge-accent',
    tone === 'success' && 'app-status-badge-success',
    tone === 'warning' && 'app-status-badge-warning',
    tone === 'danger' && 'app-status-badge-danger',
    className
  )
}

export default function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return <span className={statusBadgeClassName(tone, className)}>{label}</span>
}
