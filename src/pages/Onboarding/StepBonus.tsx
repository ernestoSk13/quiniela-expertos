import type { Team } from '@/types'
import type { BonusPredictions } from '@/types/User'

const MEXICO_PHASES = [
  { value: 'grupos',    label: 'Fase de grupos' },
  { value: 'ronda32',  label: 'Ronda de 32' },
  { value: 'octavos',  label: 'Octavos de final' },
  { value: 'cuartos',  label: 'Cuartos de final' },
  { value: 'semis',    label: 'Semifinales' },
  { value: 'tercero',  label: 'Tercer lugar' },
  { value: 'campeon',  label: 'Campeón' },
]

interface Props {
  bonus: BonusPredictions
  teams: Team[]
  onBonusChange: (b: BonusPredictions) => void
  onBack: () => void
  onSubmit: () => void
  loading: boolean
}

export default function StepBonus({ bonus, teams, onBonusChange, onBack, onSubmit, loading }: Props) {
  function set(key: keyof BonusPredictions, value: string) {
    onBonusChange({ ...bonus, [key]: value })
  }

  const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
    const g = t.group ?? 'Sin grupo'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort()

  const isValid =
    bonus.topScorer.trim() &&
    bonus.goldenBall.trim() &&
    bonus.mexicoPhase &&
    bonus.champion

  return (
    <div className="space-y-6">
      {/* Goleador */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          Goleador del torneo
        </label>
        <input
          type="text"
          value={bonus.topScorer}
          onChange={e => set('topScorer', e.target.value)}
          placeholder="Nombre del jugador"
          maxLength={50}
          className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-3 transition-colors"
        />
      </div>

      {/* Balón de Oro */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          Balón de Oro
        </label>
        <input
          type="text"
          value={bonus.goldenBall}
          onChange={e => set('goldenBall', e.target.value)}
          placeholder="Nombre del jugador"
          maxLength={50}
          className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-3 transition-colors"
        />
      </div>

      {/* Fase México */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          ¿Hasta qué fase llega México?
        </label>
        <select
          value={bonus.mexicoPhase}
          onChange={e => set('mexicoPhase', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-xl px-4 py-3 transition-colors"
        >
          <option value="" disabled>Selecciona una fase</option>
          {MEXICO_PHASES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Campeón */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          Campeón del Mundial
        </label>
        <select
          value={bonus.champion}
          onChange={e => set('champion', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-xl px-4 py-3 transition-colors"
        >
          <option value="" disabled>Selecciona un equipo</option>
          {groups.map(g => (
            <optgroup key={g} label={`Grupo ${g}`}>
              {grouped[g].map(t => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500">
        Estos pronósticos se guardan una sola vez y no se pueden modificar después.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || loading}
          className="flex-2 flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Guardando...' : '¡Listo!'}
        </button>
      </div>
    </div>
  )
}
