import { useState } from 'react'
import { useTeamsMap } from '@/hooks/useTeams'
import { evaluateBonusPredictions } from '@/services/cloudFunctions'

const MEXICO_PHASES = [
  { value: 'grupos',   label: 'Fase de grupos' },
  { value: 'ronda32',  label: 'Ronda de 32' },
  { value: 'octavos',  label: 'Octavos de final' },
  { value: 'cuartos',  label: 'Cuartos de final' },
  { value: 'semis',    label: 'Semifinales' },
  { value: 'tercero',  label: 'Tercer lugar' },
  { value: 'campeon',  label: 'Campeón' },
]

export default function BonusEvaluation() {
  const { teamsMap, loading: teamsLoading } = useTeamsMap()

  const [topScorer, setTopScorer] = useState('')
  const [goldenBall, setGoldenBall] = useState('')
  const [mexicoPhase, setMexicoPhase] = useState('')
  const [champion, setChampion] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teams = Object.values(teamsMap).sort((a, b) => {
    const ga = a.group ?? ''
    const gb = b.group ?? ''
    return ga.localeCompare(gb) || a.name.localeCompare(b.name)
  })

  const grouped = teams.reduce<Record<string, typeof teams>>((acc, t) => {
    const g = t.group ?? 'Sin grupo'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort()

  const isValid = topScorer.trim() && goldenBall.trim() && mexicoPhase && champion

  async function handleSubmit() {
    if (!isValid) return
    const confirmed = window.confirm(
      '¿Confirmas los resultados finales?\n\n' +
      `Goleador: ${topScorer}\n` +
      `Balón de Oro: ${goldenBall}\n` +
      `Fase México: ${MEXICO_PHASES.find(p => p.value === mexicoPhase)?.label}\n` +
      `Campeón: ${teamsMap[champion]?.name ?? champion}\n\n` +
      'Se otorgarán puntos a todos los jugadores. Esta acción no se puede deshacer.',
    )
    if (!confirmed) return

    setSaving(true)
    setError(null)
    try {
      await evaluateBonusPredictions({ topScorer, goldenBall, mexicoPhase, champion })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg">
        <div className="surface-card border border-gray-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="text-lg font-semibold text-white">¡Puntos bonus otorgados!</p>
          <p className="text-sm text-gray-400">Los pronósticos bonus de todos los jugadores han sido evaluados.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold">Evaluar pronósticos bonus</h1>
        <p className="text-sm text-gray-400 mt-1">
          Ingresa los resultados finales del torneo. Cada acierto vale 5 puntos.
        </p>
      </div>

      <div className="surface-card border border-gray-800 rounded-xl p-5 space-y-5">

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Goleador del torneo</label>
          <input
            type="text"
            value={topScorer}
            onChange={e => setTopScorer(e.target.value)}
            placeholder="Nombre del jugador"
            maxLength={60}
            className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Balón de Oro</label>
          <input
            type="text"
            value={goldenBall}
            onChange={e => setGoldenBall(e.target.value)}
            placeholder="Nombre del jugador"
            maxLength={60}
            className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">¿Hasta qué fase llegó México?</label>
          <select
            value={mexicoPhase}
            onChange={e => setMexicoPhase(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-xl px-3 py-2 text-sm transition-colors"
          >
            <option value="" disabled>Selecciona una fase</option>
            {MEXICO_PHASES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Campeón del Mundial</label>
          {teamsLoading ? (
            <p className="text-xs text-gray-500">Cargando equipos...</p>
          ) : (
            <select
              value={champion}
              onChange={e => setChampion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-xl px-3 py-2 text-sm transition-colors"
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
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || saving}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {saving ? 'Evaluando...' : 'Otorgar puntos bonus'}
      </button>
    </div>
  )
}
