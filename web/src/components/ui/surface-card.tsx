import type { HTMLAttributes, ReactNode } from 'react'

export type SurfaceCardTone =
  | 'default'
  | 'subtle'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'

type SurfaceCardClassOptions = {
  tone?: SurfaceCardTone
  className?: string
}

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> &
  Omit<SurfaceCardClassOptions, 'className'> & {
    className?: string
    children: ReactNode
  }

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function surfaceCardClassName(options: SurfaceCardClassOptions = {}) {
  const { tone = 'default', className } = options

  return joinClasses(
    'app-surface-card rounded-2xl',
    tone === 'subtle' && 'app-surface-card-subtle',
    tone === 'accent' && 'app-surface-card-accent',
    tone === 'success' && 'app-surface-card-success',
    tone === 'warning' && 'app-surface-card-warning',
    tone === 'danger' && 'app-surface-card-danger',
    className
  )
}

export default function SurfaceCard({
  tone = 'default',
  className,
  children,
  ...props
}: SurfaceCardProps) {
  return (
    <div className={surfaceCardClassName({ tone, className })} {...props}>
      {children}
    </div>
  )
}
