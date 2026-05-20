import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMatchdays } from '@/hooks/useMatchdays'
import { updateMatchdayStatus, updateMatchdayDeadline } from '@/services/firestoreMatchdays'
import StatusBadge from '@/components/StatusBadge'
import type { Matchday, MatchdayStatus } from '@/types'

const STATUS_CYCLE: Record<MatchdayStatus, MatchdayStatus> = {
  upcoming: 'open',
  open:     'closed',
  closed:   'finished',
  finished: 'upcoming',
}

const STATUS_CYCLE_LABEL: Record<MatchdayStatus, string> = {
  upcoming: 'Abrir',
  open:     'Cerrar',
  closed:   'Finalizar',
  finished: 'Reactivar',
}

function formatDate(ts: Matchday['predictionDeadline']) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

function toDatetimeLocal(ts: Matchday['predictionDeadline']): string {
  if (!ts) return ''
  const d = ts.toDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export default function MatchdayList() {
  const { matchdays, loading } = useMatchdays()
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null)
  const [deadlineInput, setDeadlineInput] = useState('')
  const [savingDeadline, setSavingDeadline] = useState(false)

  async function handleStatusChange(md: Matchday) {
    setUpdating(md.id)
    try {
      await updateMatchdayStatus(md.id, STATUS_CYCLE[md.status])
    } finally {
      setUpdating(null)
    }
  }

  function startEditDeadline(md: Matchday) {
    setEditingDeadline(md.id)
    setDeadlineInput(toDatetimeLocal(md.predictionDeadline))
  }

  async function handleSaveDeadline(md: Matchday) {
    if (!deadlineInput) return
    setSavingDeadline(true)
    try {
      await updateMatchdayDeadline(md.id, new Date(deadlineInput + ':00Z'))
      setEditingDeadline(null)
    } finally {
      setSavingDeadline(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Cargando jornadas...</p>
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Jornadas</h1>

      <div className="space-y-3">
        {matchdays.map(md => (
          <div
            key={md.id}
            className="surface-card border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{md.name}</span>
                <StatusBadge status={md.status} type="matchday" />
              </div>

              {editingDeadline === md.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="datetime-local"
                    value={deadlineInput}
                    onChange={e => setDeadlineInput(e.target.value)}
                    className="bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-lg px-2 py-1 text-xs transition-colors"
                  />
                  <button
                    onClick={() => handleSaveDeadline(md)}
                    disabled={savingDeadline || !deadlineInput}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--accent-hover)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
                  >
                    {savingDeadline ? '...' : 'OK'}
                  </button>
                  <button
                    onClick={() => setEditingDeadline(null)}
                    disabled={savingDeadline}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Deadline:{' '}
                  <span className="text-gray-400">{formatDate(md.predictionDeadline)}</span>
                  <button
                    onClick={() => startEditDeadline(md)}
                    className="ml-2 text-xs text-gray-600 hover:text-[var(--accent-light)] transition-colors"
                  >
                    Editar
                  </button>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/admin/jornada/${md.id}`}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Ver partidos
              </Link>
              <button
                onClick={() => handleStatusChange(md)}
                disabled={updating === md.id}
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-hover)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
              >
                {updating === md.id ? '...' : STATUS_CYCLE_LABEL[md.status]}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
