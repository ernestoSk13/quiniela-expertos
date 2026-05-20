import type { MatchdayStatus, MatchStatus } from '@/types'

const MATCHDAY_STYLES: Record<MatchdayStatus, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  open:     'bg-[var(--accent-muted)] text-[var(--accent-light)]',
  closed:   'bg-yellow-500/20 text-yellow-400',
  finished: 'bg-gray-700 text-gray-400',
}

const MATCHDAY_LABELS: Record<MatchdayStatus, string> = {
  upcoming: 'Próxima',
  open:     'Abierta',
  closed:   'Cerrada',
  finished: 'Finalizada',
}

const MATCH_STYLES: Record<MatchStatus, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  live:     'bg-red-500/20 text-red-400',
  finished: 'bg-gray-700 text-gray-400',
}

const MATCH_LABELS: Record<MatchStatus, string> = {
  upcoming: 'Próximo',
  live:     'En vivo',
  finished: 'Finalizado',
}

interface Props {
  status: MatchdayStatus | MatchStatus
  type: 'matchday' | 'match'
}

export default function StatusBadge({ status, type }: Props) {
  const styles = type === 'matchday'
    ? MATCHDAY_STYLES[status as MatchdayStatus]
    : MATCH_STYLES[status as MatchStatus]

  const label = type === 'matchday'
    ? MATCHDAY_LABELS[status as MatchdayStatus]
    : MATCH_LABELS[status as MatchStatus]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}
