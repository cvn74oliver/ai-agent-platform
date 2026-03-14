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
    <section className="rounded-xl border border-gray-800 bg-gray-950/35 p-3 space-y-3">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">{props.title}</p>
        <p className="text-[12px] text-gray-400">{props.subtitle}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {props.items.map((item) => {
          const classes = item.active
            ? 'border-cyan-800/60 bg-cyan-950/20'
            : 'border-gray-800 bg-gray-950/45 hover:border-gray-700 hover:bg-gray-900/40'
          const content = (
            <div className={`min-w-[220px] rounded-xl border p-3 space-y-1 ${classes}`}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-base font-semibold text-gray-100">{item.value}</p>
              <p className="text-[11px] leading-5 text-gray-400">{item.subtitle}</p>
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
