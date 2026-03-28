interface RetroPlanetProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 64, md: 96, lg: 128 }

export function RetroPlanet({ size = 'md' }: RetroPlanetProps) {
  const s = sizeMap[size]

  return (
    <div className="relative inline-block" style={{ width: s, height: s }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 16 16"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Planet body — pastel purples/blues */}
        <rect x="5" y="1" width="6" height="1" fill="#C8B8F0" />
        <rect x="3" y="2" width="10" height="1" fill="#D0C0F8" />
        <rect x="2" y="3" width="12" height="1" fill="#D8C8FF" />
        <rect x="2" y="4" width="12" height="1" fill="#E0D0FF" />
        <rect x="1" y="5" width="14" height="1" fill="#D8C8FF" />
        <rect x="1" y="6" width="14" height="1" fill="#C8B8F0" />
        <rect x="1" y="7" width="14" height="1" fill="#B8A8E0" />
        <rect x="1" y="8" width="14" height="1" fill="#A898D0" />
        <rect x="1" y="9" width="14" height="1" fill="#A090C8" />
        <rect x="2" y="10" width="12" height="1" fill="#9888C0" />
        <rect x="2" y="11" width="12" height="1" fill="#9080B8" />
        <rect x="3" y="12" width="10" height="1" fill="#8878B0" />
        <rect x="5" y="13" width="6" height="1" fill="#8070A8" />

        {/* Highlight pixels */}
        <rect x="5" y="3" width="2" height="1" fill="#F0E8FF" opacity="0.7" />
        <rect x="4" y="4" width="3" height="1" fill="#F0E8FF" opacity="0.5" />
        <rect x="4" y="5" width="2" height="1" fill="#E8E0FF" opacity="0.3" />

        {/* Surface features */}
        <rect x="8" y="5" width="2" height="1" fill="#A898D0" />
        <rect x="4" y="8" width="3" height="1" fill="#9888C0" />
        <rect x="9" y="9" width="2" height="1" fill="#9080B8" />

        {/* Ring — soft pink/peach */}
        <rect x="0" y="7" width="2" height="1" fill="#F8C8B0" opacity="0.5" />
        <rect x="14" y="7" width="2" height="1" fill="#F8C8B0" opacity="0.5" />
        <rect x="0" y="9" width="3" height="1" fill="#F8C8B0" opacity="0.6" />
        <rect x="13" y="9" width="3" height="1" fill="#F8C8B0" opacity="0.6" />
      </svg>

      {/* Pixel stars */}
      {[
        { x: '5%', y: '10%', c: '#F8C8B0' },
        { x: '85%', y: '5%', c: '#A8D8A8' },
        { x: '90%', y: '80%', c: '#F8D888' },
        { x: '10%', y: '75%', c: '#C8B8F0' },
        { x: '50%', y: '0%', c: '#F0A0A0' },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: star.x,
            top: star.y,
            width: 3,
            height: 3,
            backgroundColor: star.c,
            imageRendering: 'pixelated',
            animation: `pixelTwinkle 2.5s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes pixelTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
