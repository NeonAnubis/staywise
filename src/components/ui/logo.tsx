import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'default' | 'light' | 'dark'
}

const sizes = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 56, text: 'text-3xl' },
}

export function Logo({
  className,
  size = 'md',
  showText = true,
  variant = 'default'
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]

  const colors = {
    default: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--primary) / 0.7)',
      accent: 'hsl(var(--primary) / 0.4)',
      text: 'text-foreground',
    },
    light: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.7)',
      accent: 'rgba(255,255,255,0.4)',
      text: 'text-white',
    },
    dark: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#0f3460',
      text: 'text-gray-900',
    },
  }

  const colorSet = colors[variant]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background shape - rounded square */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          fill={colorSet.primary}
        />

        {/* Building silhouette */}
        <path
          d="M14 36V18C14 16.8954 14.8954 16 16 16H22C23.1046 16 24 16.8954 24 18V36"
          fill={colorSet.secondary}
          opacity="0.3"
        />
        <path
          d="M24 36V14C24 12.8954 24.8954 12 26 12H32C33.1046 12 34 12.8954 34 14V36"
          fill={colorSet.secondary}
          opacity="0.5"
        />

        {/* Stylized S shape */}
        <path
          d="M28 16C28 16 32 16 32 20C32 24 24 24 24 28C24 32 28 32 28 32"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Windows */}
        <rect x="16" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="16" y="26" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />

        {/* Door */}
        <rect x="17" y="32" width="4" height="4" rx="0.5" fill="white" />

        {/* Roof accent */}
        <path
          d="M24 12L28 8L32 12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          textSize,
          colorSet.text
        )}>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Stay
          </span>
          <span className="text-muted-foreground">wise</span>
        </span>
      )}
    </div>
  )
}

// Icon-only version for favicon, app icon, etc.
export function LogoIcon({
  className,
  size = 32
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background shape - rounded square */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="hsl(var(--primary))"
      />

      {/* Building silhouette */}
      <path
        d="M14 36V18C14 16.8954 14.8954 16 16 16H22C23.1046 16 24 16.8954 24 18V36"
        fill="hsl(var(--primary) / 0.7)"
        opacity="0.3"
      />
      <path
        d="M24 36V14C24 12.8954 24.8954 12 26 12H32C33.1046 12 34 12.8954 34 14V36"
        fill="hsl(var(--primary) / 0.7)"
        opacity="0.5"
      />

      {/* Stylized S shape */}
      <path
        d="M28 16C28 16 32 16 32 20C32 24 24 24 24 28C24 32 28 32 28 32"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Windows */}
      <rect x="16" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
      <rect x="16" y="26" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />

      {/* Door */}
      <rect x="17" y="32" width="4" height="4" rx="0.5" fill="white" />

      {/* Roof accent */}
      <path
        d="M24 12L28 8L32 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}
