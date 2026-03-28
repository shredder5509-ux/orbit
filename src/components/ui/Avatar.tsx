import { motion } from 'framer-motion'

// Each planet is a unique pixel art SVG with its own color palette
// Players pick one and it "evolves" as they level up

interface PlanetDef {
  name: string
  // Each planet has body colors, feature colors, and optional ring/moon
  body: string[]       // gradient of body rows (top to bottom)
  features: string[]   // surface detail colors
  ring?: string        // ring color
  moon?: string        // tiny moon color
}

const PLANETS: Record<string, PlanetDef> = {
  lavender: {
    name: 'Lavender',
    body: ['#D8C8FF', '#D0C0F8', '#C8B8F0', '#B8A8E0', '#A898D0', '#9888C0'],
    features: ['#E8E0FF', '#9080B8'],
    ring: '#F0C8D8',
  },
  coral: {
    name: 'Coral',
    body: ['#FFD0C8', '#FFC0B0', '#FFB0A0', '#F0A090', '#E89080', '#D88070'],
    features: ['#FFE0D8', '#C87060'],
    moon: '#FFF0C0',
  },
  mint: {
    name: 'Mint',
    body: ['#C0F0D8', '#A8E8C8', '#90E0B8', '#78D0A8', '#60C098', '#50B088'],
    features: ['#D8F8E8', '#40A078'],
    ring: '#C0E0F0',
  },
  sunset: {
    name: 'Sunset',
    body: ['#FFE0A0', '#FFD088', '#FFC070', '#F0A858', '#E89040', '#D07830'],
    features: ['#FFF0C0', '#C06820'],
    moon: '#FFE8E0',
  },
  ocean: {
    name: 'Ocean',
    body: ['#A8D8F0', '#90C8E8', '#78B8E0', '#60A8D0', '#4898C0', '#3888B0'],
    features: ['#C0E8FF', '#2878A0'],
    ring: '#D0F0E8',
  },
  rose: {
    name: 'Rose',
    body: ['#F8C0D0', '#F0B0C0', '#E8A0B0', '#D890A0', '#C88090', '#B87080'],
    features: ['#FFD8E8', '#A86070'],
    moon: '#E0D0F0',
  },
  ice: {
    name: 'Ice',
    body: ['#D8E8F8', '#C8E0F0', '#B8D8F0', '#A8C8E0', '#98B8D0', '#88A8C0'],
    features: ['#F0F8FF', '#7898B0'],
    ring: '#E0E8F0',
  },
  ember: {
    name: 'Ember',
    body: ['#F8D0A0', '#F0C088', '#E8A870', '#D89058', '#C87840', '#B86830'],
    features: ['#FFE8C0', '#A85820'],
    moon: '#F0D0D0',
  },
  forest: {
    name: 'Forest',
    body: ['#A0D8A0', '#88C888', '#70B870', '#58A858', '#489848', '#388838'],
    features: ['#C0F0C0', '#287828'],
    ring: '#E0D0A0',
  },
  amethyst: {
    name: 'Amethyst',
    body: ['#D0B8F0', '#C0A8E8', '#B098E0', '#A088D0', '#9078C0', '#8068B0'],
    features: ['#E8D8FF', '#7058A0'],
    moon: '#F0E0FF',
  },
  sand: {
    name: 'Sand',
    body: ['#F0E0C0', '#E8D8B0', '#E0D0A0', '#D0C090', '#C0B080', '#B0A070'],
    features: ['#FFF0D8', '#A09060'],
    ring: '#F0C0A0',
  },
  arctic: {
    name: 'Arctic',
    body: ['#E8F0F8', '#D8E8F0', '#C8E0E8', '#B8D0E0', '#A8C0D0', '#98B0C0'],
    features: ['#F8FFFF', '#88A0B0'],
    moon: '#F0F0FF',
  },
}

function renderPlanetSVG(planet: PlanetDef, pixelSize: number) {
  const s = pixelSize
  const body = planet.body
  const feat = planet.features

  return (
    <svg width={s} height={s} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* Planet body */}
      <rect x="5" y="1" width="6" height="1" fill={body[0]} />
      <rect x="3" y="2" width="10" height="1" fill={body[0]} />
      <rect x="2" y="3" width="12" height="1" fill={body[1]} />
      <rect x="2" y="4" width="12" height="1" fill={body[1]} />
      <rect x="1" y="5" width="14" height="1" fill={body[2]} />
      <rect x="1" y="6" width="14" height="1" fill={body[2]} />
      <rect x="1" y="7" width="14" height="1" fill={body[3]} />
      <rect x="1" y="8" width="14" height="1" fill={body[3]} />
      <rect x="1" y="9" width="14" height="1" fill={body[4]} />
      <rect x="2" y="10" width="12" height="1" fill={body[4]} />
      <rect x="2" y="11" width="12" height="1" fill={body[5]} />
      <rect x="3" y="12" width="10" height="1" fill={body[5]} />
      <rect x="5" y="13" width="6" height="1" fill={body[5]} />

      {/* Highlight */}
      <rect x="5" y="3" width="2" height="1" fill={feat[0]} opacity="0.7" />
      <rect x="4" y="4" width="3" height="1" fill={feat[0]} opacity="0.5" />
      <rect x="4" y="5" width="2" height="1" fill={feat[0]} opacity="0.3" />

      {/* Surface features */}
      <rect x="8" y="5" width="3" height="1" fill={feat[1]} opacity="0.5" />
      <rect x="4" y="8" width="3" height="2" fill={feat[1]} opacity="0.4" />
      <rect x="9" y="10" width="2" height="1" fill={feat[1]} opacity="0.3" />

      {/* Ring */}
      {planet.ring && (
        <>
          <rect x="0" y="7" width="2" height="1" fill={planet.ring} opacity="0.5" />
          <rect x="14" y="7" width="2" height="1" fill={planet.ring} opacity="0.5" />
          <rect x="0" y="9" width="3" height="1" fill={planet.ring} opacity="0.4" />
          <rect x="13" y="9" width="3" height="1" fill={planet.ring} opacity="0.4" />
        </>
      )}

      {/* Moon */}
      {planet.moon && (
        <>
          <rect x="13" y="2" width="2" height="2" fill={planet.moon} opacity="0.7" />
        </>
      )}
    </svg>
  )
}

interface AvatarProps {
  avatarId: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  selected?: boolean
  onClick?: () => void
  level?: number
  locked?: boolean
}

const pixelSizeMap = { sm: 28, md: 36, lg: 48, xl: 64 }
const containerSizeMap = {
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-22 h-22',
}

export function Avatar({ avatarId, size = 'md', selected, onClick, level = 1, locked = false }: AvatarProps) {
  const planet = PLANETS[avatarId] || PLANETS.lavender
  const px = pixelSizeMap[size]

  return (
    <motion.div
      whileHover={onClick && !locked ? { scale: 1.08 } : undefined}
      whileTap={onClick && !locked ? { scale: 0.94 } : undefined}
      onClick={locked ? undefined : onClick}
      className={`
        ${containerSizeMap[size]}
        rounded-full flex items-center justify-center relative
        ${selected
          ? 'ring-2 ring-text-primary ring-offset-2 dark:ring-dark-text-primary dark:ring-offset-dark-bg'
          : ''
        }
        ${onClick && !locked ? 'cursor-pointer' : ''}
        ${locked ? 'opacity-40 grayscale' : ''}
        transition-all
      `}
      style={{ backgroundColor: planet.body[0] + '30' }}
      title={locked ? 'Upgrade to Pro to unlock' : undefined}
    >
      {renderPlanetSVG(planet, px)}

      {/* Lock overlay */}
      {locked && size !== 'sm' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="10" height="12" viewBox="0 0 10 12" style={{ imageRendering: 'pixelated' }}>
            <rect x="1" y="4" width="8" height="7" fill="#999" opacity="0.8" />
            <rect x="3" y="0" width="4" height="5" fill="none" stroke="#999" strokeWidth="1.5" opacity="0.8" />
            <rect x="4" y="7" width="2" height="2" fill="#ccc" />
          </svg>
        </div>
      )}

      {/* Level indicator */}
      {level > 1 && size !== 'sm' && !locked && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-dark-bg border border-border dark:border-dark-border rounded-full w-4 h-4 flex items-center justify-center">
          <span className="text-[7px] font-bold text-text-primary dark:text-dark-text-primary">{level}</span>
        </div>
      )}
    </motion.div>
  )
}

export function getAvatarIds(): string[] {
  return Object.keys(PLANETS)
}

export function getAvatarName(id: string): string {
  return PLANETS[id]?.name || 'Planet'
}
