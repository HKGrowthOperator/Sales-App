import { LeadStatus, LeadScore } from '@/lib/types'
import { getStatusColor, getScoreColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', getStatusColor(status))}>
      {status}
    </span>
  )
}

export function ScoreBadge({ score }: { score: LeadScore | null | undefined }) {
  if (!score) return <span className="text-slate-400 text-xs">–</span>
  return (
    <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold', getScoreColor(score))}>
      {score === 'No-Fit' ? '✗' : score}
    </span>
  )
}
