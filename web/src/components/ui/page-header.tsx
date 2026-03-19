import type { ReactNode } from 'react'
import SurfaceCard from '@/components/ui/surface-card'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string | null
  actions?: ReactNode
  tone?: 'default' | 'hero'
  className?: string
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tone = 'default',
  className,
}: PageHeaderProps) {
  return (
    <SurfaceCard
      tone={tone === 'hero' ? 'accent' : 'default'}
      className={joinClasses(
        'app-page-header',
        tone === 'hero' && 'app-page-header-hero',
        tone === 'default' && 'app-page-header-default',
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="app-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-gray-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </SurfaceCard>
  )
}
