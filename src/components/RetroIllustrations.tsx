// Pixel art illustrations — soft pastel colors on light backgrounds

export function PixelStar({ className = '', size = 8, color = '#F8D888' }: { className?: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 4 4" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="0" width="2" height="1" fill={color} />
      <rect x="0" y="1" width="4" height="2" fill={color} />
      <rect x="1" y="3" width="2" height="1" fill={color} />
    </svg>
  )
}

export function PixelHeart({ className = '', size = 12 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 7" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="0" width="2" height="1" fill="#F0A0A0" />
      <rect x="5" y="0" width="2" height="1" fill="#F0A0A0" />
      <rect x="0" y="1" width="4" height="1" fill="#F0A0A0" />
      <rect x="4" y="1" width="4" height="1" fill="#F0A0A0" />
      <rect x="0" y="2" width="8" height="1" fill="#E89090" />
      <rect x="1" y="3" width="6" height="1" fill="#E89090" />
      <rect x="2" y="4" width="4" height="1" fill="#E08080" />
      <rect x="3" y="5" width="2" height="1" fill="#D87070" />
    </svg>
  )
}

export function PixelGem({ className = '', size = 10, color = '#A8D8A8' }: { className?: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 6 6" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="0" width="2" height="1" fill={color} />
      <rect x="1" y="1" width="4" height="1" fill={color} />
      <rect x="0" y="2" width="6" height="1" fill={color} />
      <rect x="1" y="3" width="4" height="1" fill={color} opacity="0.7" />
      <rect x="2" y="4" width="2" height="1" fill={color} opacity="0.5" />
    </svg>
  )
}

export function PixelPotion({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 8 10" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="0" width="2" height="2" fill="#D0C0E0" />
      <rect x="2" y="2" width="4" height="1" fill="#C8B8F0" />
      <rect x="1" y="3" width="6" height="4" fill="#C8B8F0" />
      <rect x="2" y="7" width="4" height="1" fill="#B8A8E0" />
      <rect x="2" y="4" width="4" height="3" fill="#D8C8FF" />
      <rect x="3" y="4" width="2" height="1" fill="#E8E0FF" />
      <rect x="2" y="3" width="1" height="1" fill="#F0E8FF" opacity="0.5" />
    </svg>
  )
}

export function PixelScroll({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="0" width="8" height="1" fill="#F0E8D8" />
      <rect x="0" y="1" width="10" height="1" fill="#E8E0D0" />
      <rect x="1" y="2" width="8" height="6" fill="#FFF8F0" />
      <rect x="0" y="8" width="10" height="1" fill="#E8E0D0" />
      <rect x="1" y="9" width="8" height="1" fill="#F0E8D8" />
      <rect x="2" y="3" width="5" height="1" fill="#D0C8B8" opacity="0.4" />
      <rect x="2" y="5" width="6" height="1" fill="#D0C8B8" opacity="0.4" />
      <rect x="2" y="7" width="4" height="1" fill="#D0C8B8" opacity="0.4" />
    </svg>
  )
}

export function PixelSword({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 6 9" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="0" width="2" height="1" fill="#D0D0E0" />
      <rect x="2" y="1" width="2" height="4" fill="#C0C0D0" />
      <rect x="1" y="5" width="4" height="1" fill="#F8D888" />
      <rect x="2" y="6" width="2" height="2" fill="#C8A878" />
      <rect x="2" y="8" width="2" height="1" fill="#B89868" />
    </svg>
  )
}

export function PixelShield({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 8 9" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="0" width="6" height="1" fill="#F8D888" />
      <rect x="0" y="1" width="8" height="1" fill="#F0C878" />
      <rect x="0" y="2" width="8" height="3" fill="#E8B868" />
      <rect x="1" y="5" width="6" height="1" fill="#E0B060" />
      <rect x="2" y="6" width="4" height="1" fill="#D8A858" />
      <rect x="3" y="7" width="2" height="1" fill="#D0A050" />
      <rect x="3" y="2" width="2" height="2" fill="#F8D888" />
    </svg>
  )
}

// Background pixel scene — soft pastel stars and items
export function PixelScene({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      {[
        { x: '8%', y: '8%', color: '#F8D888', size: 6, delay: 0 },
        { x: '88%', y: '5%', color: '#A8D8A8', size: 5, delay: 0.8 },
        { x: '15%', y: '25%', color: '#C8B8F0', size: 4, delay: 1.6 },
        { x: '92%', y: '30%', color: '#F8C8B0', size: 6, delay: 0.4 },
        { x: '5%', y: '55%', color: '#F0A0A0', size: 4, delay: 1.2 },
        { x: '85%', y: '60%', color: '#A8D8A8', size: 5, delay: 2.0 },
        { x: '10%', y: '80%', color: '#F8D888', size: 4, delay: 0.6 },
        { x: '90%', y: '85%', color: '#C8B8F0', size: 5, delay: 1.4 },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: star.x,
            top: star.y,
            animation: `pixelFloat 4s ease-in-out ${star.delay}s infinite`,
          }}
        >
          <PixelStar size={star.size} color={star.color} />
        </div>
      ))}

      {variant === 'default' && (
        <>
          <div className="absolute top-12 right-16 opacity-25"><PixelGem size={14} color="#A8D8A8" /></div>
          <div className="absolute bottom-20 left-10 opacity-20"><PixelPotion size={16} /></div>
          <div className="absolute top-28 left-16 opacity-20"><PixelHeart size={10} /></div>
          <div className="absolute bottom-32 right-12 opacity-25"><PixelScroll size={16} /></div>
        </>
      )}

      <style>{`
        @keyframes pixelFloat {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
