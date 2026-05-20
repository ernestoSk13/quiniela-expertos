interface Props {
  url: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-16 h-16 text-xl',
  xl:  'w-24 h-24 text-3xl',
}

export default function Avatar({ url, name, size = 'md', className = '' }: Props) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${SIZES[size]} rounded-full bg-[var(--accent-hover)] flex items-center justify-center font-bold text-white shrink-0 ${className}`}>
      {initials || '?'}
    </div>
  )
}
