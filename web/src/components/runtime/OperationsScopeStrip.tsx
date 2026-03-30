import Link from 'next/link'
export type OperationsScopeStripItem = {
  label: string
  value: string
  subtitle: string
  href?: string | null
  active?: boolean
}

export function OperationsScopeStrip(props: {
  title: string
  subtitle: string
  items: OperationsScopeStripItem[]
}) {
  return (
    <section className="app-surface-card app-surface-rail-card rounded-2xl p-3 space-y-3">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-slate-300">{props.title}</p>
        <p className="text-[12px] text-slate-200">{props.subtitle}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {props.items.map((item) => {
          const classes = item.active
            ? 'app-surface-card-accent border-cyan-800/60'
            : 'app-surface-card-tile hover:border-cyan-700/45 hover:bg-[linear-gradient(180deg,rgba(28,38,53,0.96),rgba(17,24,35,0.96))]'
          const content = (
            <div className={`min-w-[220px] rounded-xl border p-3 space-y-1 ${classes}`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">{item.label}</p>
              <p className="text-base font-semibold text-slate-50">{item.value}</p>
              <p className="text-[11px] leading-5 text-slate-200">{item.subtitle}</p>
            </div>
          )

          if (item.href) {
            return (
              <Link key={`${item.label}-${item.value}`} href={item.href} className="block shrink-0">
                {content}
              </Link>
            )
          }

          return (
            <div key={`${item.label}-${item.value}`} className="shrink-0">
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
