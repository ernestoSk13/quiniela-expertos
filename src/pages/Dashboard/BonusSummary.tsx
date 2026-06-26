import { useState } from 'react'
import type { BonusPredictions, User } from '@/types/User'
import type { Team } from '@/types'
import BonusAllModal from './BonusAllModal'

// June 11, 2026 at 1:00 PM UTC
const BONUS_DEADLINE = new Date('2026-06-11T13:00:00Z')

const MEXICO_PHASE_LABELS: Record<string, string> = {
  grupos:  'Fase de grupos',
  ronda32: 'Ronda de 32',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semis:   'Semifinales',
  tercero: 'Tercer lugar',
  campeon: 'Campeón',
}

const MEXICO_PHASES = Object.entries(MEXICO_PHASE_LABELS).map(([value, label]) => ({ value, label }))

interface Props {
  bonus: BonusPredictions
  teams: Team[]
  teamsMap: Record<string, Team>
  onSave: (bonus: BonusPredictions) => Promise<void>
  players: User[]
  currentUserId: string
}

export default function BonusSummary({ bonus, teams, teamsMap, onSave, players, currentUserId }: Props) {
  const canEdit = new Date() < BONUS_DEADLINE
  const pastDeadline = new Date() >= BONUS_DEADLINE
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<BonusPredictions>(bonus)
  const [saving, setSaving] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)

  function set(key: keyof BonusPredictions, value: string) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ ...draft, pointsAwarded: false })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(bonus)
    setEditing(false)
  }

  const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
    const g = t.group ?? 'Sin grupo'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort()

  const championTeam = bonus.champion ? teamsMap[bonus.champion] : null

  return (
    <div className="surface-card border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Mis bonus
        </h3>
        <div className="flex items-center gap-3">
          {canEdit && !editing && (
            <button
              onClick={() => { setDraft(bonus); setEditing(true) }}
              className="text-xs text-[var(--accent-light)] transition-colors"
            >
              Editar
            </button>
          )}
          {!canEdit && (
            <span className="text-xs text-gray-600">Cerrado</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
          <span className="text-amber-400 text-base leading-none shrink-0">⏰</span>
          <p className="text-xs text-amber-300">
            Puedes editar tus bonus hasta el{' '}
            <span className="font-semibold">11 de jun, 1:00 PM</span>
          </p>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          {/* Goleador */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Goleador</label>
            <input
              type="text"
              value={draft.topScorer}
              onChange={e => set('topScorer', e.target.value)}
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>

          {/* Balón de Oro */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Balón de Oro</label>
            <input
              type="text"
              value={draft.goldenBall}
              onChange={e => set('goldenBall', e.target.value)}
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>

          {/* México */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">México llega a</label>
            <select
              value={draft.mexicoPhase}
              onChange={e => set('mexicoPhase', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <option value="" disabled>Selecciona una fase</option>
              {MEXICO_PHASES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Campeón */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Campeón</label>
            <select
              value={draft.champion}
              onChange={e => set('champion', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <option value="" disabled>Selecciona un equipo</option>
              {groups.map(g => (
                <optgroup key={g} label={`Grupo ${g}`}>
                  {grouped[g].map(t => (
                    <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !draft.topScorer.trim() || !draft.goldenBall.trim() || !draft.mexicoPhase || !draft.champion}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5 text-sm">
            <li className="flex justify-between gap-2">
              <span className="text-gray-500">Goleador</span>
              <span className="text-gray-200 text-right">{bonus.topScorer || '—'}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-gray-500">Balón de Oro</span>
              <span className="text-gray-200 text-right">{bonus.goldenBall || '—'}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-gray-500">México llega a</span>
              <span className="text-gray-200 text-right">
                {bonus.mexicoPhase ? MEXICO_PHASE_LABELS[bonus.mexicoPhase] ?? bonus.mexicoPhase : '—'}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-gray-500">Campeón</span>
              <span className="text-gray-200 text-right">
                {championTeam ? `${championTeam.flag} ${championTeam.name}` : bonus.champion || '—'}
              </span>
            </li>
          </ul>

          {pastDeadline && players.length > 1 && (
            <button
              onClick={() => setShowAllModal(true)}
              className="mt-4 w-full py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'var(--accent-deep)',
                border: '1px solid var(--accent-muted)',
                color: 'var(--accent-light)',
              }}
            >
              Ver predicciones de los demás
            </button>
          )}
        </>
      )}

      {showAllModal && (
        <BonusAllModal
          players={players}
          teamsMap={teamsMap}
          currentUserId={currentUserId}
          onClose={() => setShowAllModal(false)}
        />
      )}
    </div>
  )
}
