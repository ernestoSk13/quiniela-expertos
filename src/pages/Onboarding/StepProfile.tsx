import { useRef } from 'react'
import Avatar from '@/components/Avatar'

interface Props {
  displayName: string
  previewUrl: string
  onDisplayNameChange: (v: string) => void
  onFileChange: (file: File) => void
  onContinue: () => void
  loading: boolean
}

export default function StepProfile({
  displayName,
  previewUrl,
  onDisplayNameChange,
  onFileChange,
  onContinue,
  loading,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileChange(file)
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <Avatar url={previewUrl} name={displayName || '?'} size="xl" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-[var(--accent-light)] hover:text-[var(--accent-light)] transition-colors"
        >
          {previewUrl ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          ¿Cómo quieres que te llamen?
        </label>
        <input
          type="text"
          value={displayName}
          onChange={e => onDisplayNameChange(e.target.value)}
          placeholder="Tu nombre"
          maxLength={30}
          className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-3 transition-colors"
        />
        <p className="text-xs text-gray-600 mt-1">
          Así aparecerás en la tabla general.
        </p>
      </div>

      <button
        onClick={onContinue}
        disabled={!displayName.trim() || loading}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Cargando...' : 'Continuar →'}
      </button>
    </div>
  )
}
