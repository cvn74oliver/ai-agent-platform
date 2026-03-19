import type { ReactNode } from 'react'

type StatePanelTone = 'default' | 'accent' | 'success' | 'warning' | 'danger'

type StatePanelProps = {
  title?: string | null
  description?: string | null
  tone?: StatePanelTone
  className?: string
  children?: ReactNode
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function statePanelClassName(tone: StatePanelTone = 'default', className?: string) {
  return joinClasses(
    'app-state-panel rounded-2xl p-4',
    tone === 'accent' && 'app-state-panel-accent',
    tone === 'success' && 'app-state-panel-success',
    tone === 'warning' && 'app-state-panel-warning',
    tone === 'danger' && 'app-state-panel-danger',
    className
  )
}

export default function StatePanel({
  title,
  description,
  tone = 'default',
  className,
  children,
}: StatePanelProps) {
  return (
    <section className={statePanelClassName(tone, className)}>
      {title ? <p className="text-sm font-semibold text-white">{title}</p> : null}
      {description ? <p className={joinClasses('text-sm leading-6', title ? 'mt-2 text-gray-300' : 'text-gray-300')}>{description}</p> : null}
      {children ? <div className={joinClasses((title || description) && 'mt-3')}>{children}</div> : null}
    </section>
  )
}
