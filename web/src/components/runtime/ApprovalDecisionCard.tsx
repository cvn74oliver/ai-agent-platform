import type { ApprovalDecisionSummary } from '@/lib/runtime/approvalSummary'
import { statusBadgeClassName } from '@/components/ui/status-badge'
import { surfaceCardClassName } from '@/components/ui/surface-card'

type Props = {
  summary: ApprovalDecisionSummary
  compact?: boolean
  className?: string
}

function riskBadgeClass(riskLevel: ApprovalDecisionSummary['riskLevel']) {
  if (riskLevel === 'Low') return statusBadgeClassName('success')
  if (riskLevel === 'Medium') return statusBadgeClassName('warning')
  if (riskLevel === 'High') return statusBadgeClassName('danger')
  return statusBadgeClassName('neutral')
}

function renderExampleRow(
  example: ApprovalDecisionSummary['representativeExamples'][number],
  key: string
) {
  return (
    <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,150px)_110px] gap-2 border-t border-gray-800/80 py-1.5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-gray-100" title={example.subject}>
          {example.subject}
        </p>
        {example.snippet ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400" title={example.snippet}>
            {example.snippet}
          </p>
        ) : null}
      </div>
      <p className="truncate text-[11px] text-gray-400" title={example.sender || 'Unknown sender'}>
        {example.sender || 'Unknown sender'}
      </p>
      <p className="text-right text-[11px] text-gray-500">{example.date || 'Date unavailable'}</p>
    </div>
  )
}

export default function ApprovalDecisionCard({ summary, compact = false, className }: Props) {
  const hasCount = typeof summary.affectedCount === 'number' && Number.isFinite(summary.affectedCount)
  const countText = hasCount ? String(summary.affectedCount) : null
  const countUnit = summary.affectedUnit || 'items'
  const hasScopeTotals =
    summary.scopeTotals.reviewed != null ||
    summary.scopeTotals.selected != null ||
    summary.scopeTotals.excluded != null

  if (compact) {
    return (
      <div className={className || surfaceCardClassName({ tone: 'accent', className: 'rounded-xl p-2' })}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[11px] uppercase tracking-wide text-cyan-300">Decision</p>
            <p className="truncate text-[13px] font-semibold text-cyan-100" title={summary.actionLabel}>
              {summary.actionLabel}
            </p>
            <p className="truncate text-[11px] text-gray-300" title={summary.batchSourceLabel}>
              {summary.batchSourceLabel}
            </p>
            <p className="truncate text-[11px] text-gray-400" title={summary.scopeLabel}>
              {summary.scopeLabel}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {hasCount ? (
              <span className="rounded-md border border-cyan-800/70 bg-cyan-950/45 px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
                {summary.affectedCountIsEstimate ? '~' : ''}
                {countText} {countUnit}
                {summary.affectedCountIsEstimate ? ' est.' : ''}
              </span>
            ) : null}
            <span className={riskBadgeClass(summary.riskLevel)}>
              {summary.riskLevel} risk
            </span>
            <span className="rounded-full border border-blue-900/70 bg-blue-950/35 px-2 py-0.5 text-[11px] text-blue-200">
              {summary.reversible ? 'Reversible' : 'Not reversible'}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">{summary.previewCoverageLabel}</p>
        {hasScopeTotals ? (
          <div className="mt-1 grid gap-1 text-[10px] text-gray-300 sm:grid-cols-3">
            <p>
              Reviewed:{' '}
              <span className="font-semibold text-gray-100">
                {summary.scopeTotals.reviewed != null ? summary.scopeTotals.reviewed : '—'}
              </span>
            </p>
            <p>
              {summary.actionLabel.toLowerCase().includes('archive') ? 'Archive' : 'Selected'}:{' '}
              <span className="font-semibold text-gray-100">
                {summary.scopeTotals.selected != null ? summary.scopeTotals.selected : '—'}
              </span>
            </p>
            <p>
              Kept/Excluded:{' '}
              <span className="font-semibold text-gray-100">
                {summary.scopeTotals.excluded != null ? summary.scopeTotals.excluded : '—'}
              </span>
            </p>
          </div>
        ) : null}
        <details className="mt-1 rounded border border-gray-800/90 bg-gray-950/30 p-1.5">
          <summary className="cursor-pointer list-none text-[11px] font-medium text-gray-300">
            Details
          </summary>
          <div className="mt-1 space-y-1 text-[11px] text-gray-400">
            <p>
              Batch: {summary.batchTypeLabel} · {summary.selectionMethodLabel}
            </p>
            <p>Why selected: {summary.selectionBasis}</p>
            <p>Breakdown: {summary.contentBreakdown.join(' · ')}</p>
          </div>
        </details>
      </div>
    )
  }

  return (
    <div
      className={
        className || surfaceCardClassName({ tone: 'accent', className: 'rounded-2xl p-3' })
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300">Approval decision</p>
          <p className="text-lg font-semibold text-cyan-100">{summary.actionLabel}</p>
          <p className="text-[12px] text-gray-200">{summary.batchSourceLabel}</p>
          <p className="text-[11px] text-gray-400">{summary.scopeLabel}</p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-1.5">
          {hasCount ? (
            <div className="rounded-md border border-cyan-800/75 bg-cyan-950/45 px-2.5 py-1 text-right">
              <p className="text-[10px] uppercase tracking-wide text-cyan-300">Affected</p>
              <p className="text-lg font-semibold leading-none text-cyan-100">
                {summary.affectedCountIsEstimate ? '~' : ''}
                {countText}
              </p>
              <p className="text-[10px] text-cyan-200">
                {countUnit}
                {summary.affectedCountIsEstimate ? ' (estimate)' : ''}
              </p>
            </div>
          ) : null}
          <span className={riskBadgeClass(summary.riskLevel)}>
            {summary.riskLevel} risk
          </span>
          <span className="rounded-full border border-blue-900/70 bg-blue-950/35 px-2 py-0.5 text-[11px] text-blue-200">
            {summary.reversible ? 'Reversible' : 'Not reversible'}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-gray-700 bg-gray-900/70 px-2 py-0.5 text-[11px] text-gray-200">
          Batch type: {summary.batchTypeLabel}
        </span>
        <span className="rounded-full border border-gray-700 bg-gray-900/70 px-2 py-0.5 text-[11px] text-gray-200">
          Selection: {summary.selectionMethodLabel}
        </span>
        <span className="rounded-full border border-gray-700 bg-gray-900/70 px-2 py-0.5 text-[11px] text-gray-200">
          {summary.previewCoverageLabel}
        </span>
      </div>

      {hasScopeTotals ? (
        <div className="mt-2 rounded border border-gray-800 bg-gray-950/35 p-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Approval scope</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-gray-800 bg-gray-950/45 p-1.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Total reviewed</p>
              <p className="text-base font-semibold text-gray-100">
                {summary.scopeTotals.reviewed != null ? summary.scopeTotals.reviewed : '—'}
              </p>
            </div>
            <div className="rounded border border-emerald-900/55 bg-emerald-950/20 p-1.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                {summary.actionLabel.toLowerCase().includes('archive') ? 'Archive selected' : 'Selected'}
              </p>
              <p className="text-base font-semibold text-emerald-100">
                {summary.scopeTotals.selected != null ? summary.scopeTotals.selected : '—'}
              </p>
            </div>
            <div className="rounded border border-amber-900/55 bg-amber-950/20 p-1.5">
              <p className="text-[10px] uppercase tracking-wide text-amber-300">Excluded / kept</p>
              <p className="text-base font-semibold text-amber-100">
                {summary.scopeTotals.excluded != null ? summary.scopeTotals.excluded : '—'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-2 rounded border border-cyan-900/35 bg-gray-950/35 p-2">
        <p className="text-[11px] uppercase tracking-wide text-cyan-300">Representative examples</p>
        <div className="mt-1 grid grid-cols-[minmax(0,1fr)_minmax(0,150px)_110px] gap-2 border-b border-gray-800/80 pb-1 text-[10px] uppercase tracking-wide text-gray-500">
          <p>Subject</p>
          <p>Sender</p>
          <p className="text-right">Date</p>
        </div>
        <div className="mt-1 space-y-0.5">
          {summary.representativeExamples.slice(0, 5).map((example, index) =>
            renderExampleRow(example, `example-${index}`)
          )}
        </div>
      </div>

      <details className="mt-2 rounded border border-gray-800 bg-gray-950/25 p-2">
        <summary className="cursor-pointer list-none text-[11px] font-medium text-gray-300">
          Supporting details
        </summary>
        <div className="mt-1.5 space-y-2">
          <p className="text-[11px] text-gray-400">
            <span className="text-gray-300">Why selected:</span> {summary.selectionBasis}
          </p>
          <p className="text-[11px] text-gray-400">
            <span className="text-gray-300">Content breakdown:</span> {summary.contentBreakdown.join(' · ')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.safetySignals.map((signal) => (
              <span
                key={`safe-${signal}`}
                className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-200"
              >
                {signal}
              </span>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-gray-800 bg-gray-950/30 p-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Exclusions</p>
              <ul className="mt-1 space-y-0.5">
                {summary.safetyExclusions.map((item) => (
                  <li key={`exclude-${item}`} className="text-[11px] text-gray-300">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-gray-800 bg-gray-950/30 p-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">What happens if approved</p>
              <ul className="mt-1 space-y-0.5">
                {summary.approvalEffect.map((item) => (
                  <li key={`effect-${item}`} className="text-[11px] text-gray-300">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
