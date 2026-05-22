import { useState, useEffect } from 'react'
import { useScoringConfig } from '@/hooks/useScoringConfig'
import { saveScoringConfig, type ScoringConfig } from '@/services/firestoreConfig'

interface FieldDef {
  key: keyof ScoringConfig
  label: string
  description: string
}

const FIELDS: { group: string; fields: FieldDef[] }[] = [
  {
    group: 'Partidos (grupos y eliminatorias sin empate al 90\')',
    fields: [
      { key: 'exactScore',    label: 'Marcador exacto',    description: 'Aciertan home y away exactamente' },
      { key: 'correctResult', label: 'Resultado correcto', description: 'G/E/P correcto (grupos) o ganador correcto (eliminatorias), sin exacto' },
    ],
  },
  {
    group: 'Eliminatorias con empate al 90\'',
    fields: [
      { key: 'exactKnockoutWithTie', label: 'Marcador exacto + tieWinner', description: 'Marcador exacto Y equipo que avanza correcto' },
      { key: 'correctTieWinner',     label: 'Solo tieWinner',              description: 'Equipo que avanza correcto, sin exacto de marcador' },
    ],
  },
  {
    group: 'Bonos',
    fields: [
      { key: 'groupBonus',      label: 'Bonus de fase de grupos', description: '+pts al jugador con más exactos al terminar todos los partidos de grupos' },
      { key: 'bonusPrediction', label: 'Predicción de bonus',      description: 'Por cada predicción de bonus acertada (goleador, balón de oro, etc.)' },
    ],
  },
]

export default function ScoringConfig() {
  const { config, loading } = useScoringConfig()
  const [form, setForm] = useState<ScoringConfig>(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!loading) setForm(config)
  }, [loading]) // only sync once on initial load

  function handleChange(key: keyof ScoringConfig, value: string) {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 0) return
    setForm(f => ({ ...f, [key]: n }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!showWarning) {
      setShowWarning(true)
      return
    }
    setSaving(true)
    try {
      await saveScoringConfig(form)
      setSaved(true)
      setShowWarning(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500 text-sm py-8 text-center">Cargando configuración...</p>
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Configuración de puntos</h1>
        <p className="text-gray-400 text-sm mt-1">
          Los valores se aplican en la siguiente calificación. Cambiarlos no recalifica predicciones ya puntuadas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {FIELDS.map(({ group, fields }) => (
          <div key={group} className="surface-card rounded-xl p-4 space-y-4 border border-gray-800">
            <h2 className="text-sm font-semibold text-[var(--accent-light)] uppercase tracking-wide">
              {group}
            </h2>
            {fields.map(({ key, label, description }) => (
              <div key={`${group}-${key}`} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-16 text-center bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm shrink-0 focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            ))}
          </div>
        ))}

        {showWarning && (
          <div className="rounded-xl border border-yellow-700 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-300 space-y-1">
            <p className="font-semibold">Atención</p>
            <p>
              Cambiar los puntos no recalifica automáticamente las predicciones ya puntuadas.
              Los partidos calificados antes de este cambio mantendrán sus puntos anteriores.
              Confirma para guardar de todas formas.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : showWarning ? 'Confirmar y guardar' : 'Guardar'}
          </button>
          {showWarning && (
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancelar
            </button>
          )}
          {saved && !showWarning && (
            <span className="text-sm text-green-400">Guardado</span>
          )}
        </div>
      </form>
    </div>
  )
}
