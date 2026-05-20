interface Props {
  onDigit: (d: number) => void
  onDelete: () => void
  onSave: () => void
  dirtyCount: number
  saving: boolean
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function NumericKeypad({ onDigit, onDelete, onSave, dirtyCount, saving }: Props) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 surface-nav border-t border-gray-800 px-4 pt-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving || dirtyCount === 0}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mb-3"
      >
        {saving ? 'Guardando...' : dirtyCount > 0 ? `Guardar pronósticos (${dirtyCount})` : 'Sin cambios'}
      </button>

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {DIGITS.map(d => (
          <button
            key={d}
            onClick={() => onDigit(d)}
            className="h-12 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-xl font-semibold transition-colors"
          >
            {d}
          </button>
        ))}
        {/* Bottom row: 0 (wide) + delete */}
        <button
          onClick={() => onDigit(0)}
          className="h-12 col-span-2 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-xl font-semibold transition-colors"
        >
          0
        </button>
        <button
          onClick={onDelete}
          className="h-12 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 text-xl transition-colors flex items-center justify-center"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
