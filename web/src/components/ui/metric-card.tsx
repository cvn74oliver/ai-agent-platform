import SurfaceCard, { type SurfaceCardTone } from '@/components/ui/surface-card'

type MetricCardProps = {
  title: string
  value: string
  description?: string | null
  eyebrow?: string | null
  tone?: SurfaceCardTone
  className?: string
}

export default function MetricCard({
  title,
  value,
  description,
  eyebrow,
  tone = 'default',
  className,
}: MetricCardProps) {
  return (
    <SurfaceCard tone={tone} className={className}>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{eyebrow || title}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        {description ? <p className="mt-2 text-sm leading-6 text-gray-300">{description}</p> : null}
      </div>
    </SurfaceCard>
  )
}
