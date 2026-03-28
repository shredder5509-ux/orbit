import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { useUserStore } from '../stores/userStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShopItem {
  id: string
  name: string
  description: string
  category: 'ring' | 'moon' | 'color' | 'background' | 'trail'
  price: number
  unlockLevel: number
  rarity: 'common' | 'rare' | 'legendary'
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'ring_gold', name: 'Gold Ring', description: 'A shimmering golden ring', category: 'ring', price: 200, unlockLevel: 2, rarity: 'common' },
  { id: 'ring_ice', name: 'Ice Ring', description: 'A cool crystalline ring', category: 'ring', price: 500, unlockLevel: 4, rarity: 'rare' },
  { id: 'ring_fire', name: 'Fire Ring', description: 'A blazing ring of ember', category: 'ring', price: 1500, unlockLevel: 7, rarity: 'legendary' },
  { id: 'moon_silver', name: 'Silver Moon', description: 'A tiny silver companion', category: 'moon', price: 300, unlockLevel: 3, rarity: 'common' },
  { id: 'moon_crystal', name: 'Crystal Moon', description: 'A translucent crystal moon', category: 'moon', price: 800, unlockLevel: 5, rarity: 'rare' },
  { id: 'color_galaxy', name: 'Galaxy Swirl', description: 'Deep purple and blue', category: 'color', price: 400, unlockLevel: 3, rarity: 'common' },
  { id: 'color_sunset', name: 'Sunset Blaze', description: 'Warm orange and pink', category: 'color', price: 400, unlockLevel: 3, rarity: 'common' },
  { id: 'color_aurora', name: 'Aurora', description: 'Green and blue lights', category: 'color', price: 1000, unlockLevel: 6, rarity: 'rare' },
  { id: 'color_void', name: 'Void Black', description: 'A mysterious dark planet', category: 'color', price: 2000, unlockLevel: 8, rarity: 'legendary' },
  { id: 'bg_nebula', name: 'Nebula', description: 'A colorful nebula backdrop', category: 'background', price: 600, unlockLevel: 4, rarity: 'rare' },
  { id: 'bg_asteroids', name: 'Asteroid Field', description: 'Floating space rocks', category: 'background', price: 300, unlockLevel: 2, rarity: 'common' },
  { id: 'trail_sparkle', name: 'Sparkle Trail', description: 'Leaves sparkles behind', category: 'trail', price: 500, unlockLevel: 4, rarity: 'rare' },
  { id: 'trail_comet', name: 'Comet Tail', description: 'A blazing comet trail', category: 'trail', price: 1500, unlockLevel: 7, rarity: 'legendary' },
]

interface ShopState {
  owned: string[]
  equipped: Record<string, string>
  buy: (itemId: string) => void
  equip: (category: string, itemId: string) => void
  unequip: (category: string) => void
  isOwned: (itemId: string) => boolean
}

const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      owned: [],
      equipped: {},
      buy: (itemId) => set((s) => ({ owned: [...s.owned, itemId] })),
      equip: (category, itemId) => set((s) => ({ equipped: { ...s.equipped, [category]: itemId } })),
      unequip: (category) => set((s) => {
        const eq = { ...s.equipped }
        delete eq[category]
        return { equipped: eq }
      }),
      isOwned: (itemId) => get().owned.includes(itemId),
    }),
    { name: 'orbit-shop' }
  )
)

const CATEGORY_ORDER = ['ring', 'moon', 'color', 'background', 'trail'] as const
const CATEGORY_LABELS: Record<string, string> = { ring: 'Rings', moon: 'Moons', color: 'Colors', background: 'Backgrounds', trail: 'Trails' }
const RARITY_COLORS: Record<string, string> = { common: 'text-text-muted', rare: 'text-blue-500', legendary: 'text-amber-500' }

export function ShopPage() {
  const navigate = useNavigate()
  const { xp, level, addXp } = useUserStore()
  const { owned, equipped, buy, equip, unequip, isOwned } = useShopStore()
  const [confirm, setConfirm] = useState<string | null>(null)

  const handleBuy = (item: ShopItem) => {
    if (xp < item.price || level < item.unlockLevel) return
    // Deduct XP (negative addXp)
    useUserStore.setState((s) => ({ xp: s.xp - item.price }))
    buy(item.id)
    equip(item.category, item.id)
    setConfirm(null)
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary"><ArrowLeft size={16} /></button>
          <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Planet Shop</h1>
        </div>
        <span className="text-[12px] text-text-muted flex items-center gap-1">
          <Sparkles size={10} /> {xp} XP
        </span>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = SHOP_ITEMS.filter((i) => i.category === cat)
        return (
          <div key={cat} className="mb-5">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">{CATEGORY_LABELS[cat]}</p>
            <div className="space-y-1">
              {items.map((item) => {
                const owned_ = isOwned(item.id)
                const equipped_ = equipped[item.category] === item.id
                const locked = level < item.unlockLevel
                const canAfford = xp >= item.price

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border transition-all ${
                      equipped_ ? 'border-text-primary dark:border-white/30 bg-accent-light/30 dark:bg-white/5' : 'border-border/50 dark:border-white/10'
                    } ${locked ? 'opacity-40' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-text-primary dark:text-dark-text-primary font-medium">{item.name}</span>
                        {item.rarity !== 'common' && (
                          <span className={`text-[8px] uppercase tracking-wider ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted">{item.description}</p>
                    </div>

                    <span className="text-[11px] text-text-muted shrink-0">{item.price} XP</span>

                    {locked ? (
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5"><Lock size={8} /> Lv{item.unlockLevel}</span>
                    ) : owned_ ? (
                      equipped_ ? (
                        <Button variant="secondary" size="sm" onClick={() => unequip(item.category)}>
                          <Check size={10} /> On
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => equip(item.category, item.id)}>
                          Equip
                        </Button>
                      )
                    ) : confirm === item.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleBuy(item)} disabled={!canAfford}>Yes</Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>No</Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setConfirm(item.id)} disabled={!canAfford}>
                        Buy
                      </Button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Owned items */}
      {owned.length > 0 && (
        <div className="border-t border-border/50 dark:border-white/10 pt-4 mt-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">MY ITEMS</p>
          <div className="flex flex-wrap gap-1.5">
            {owned.map((id) => {
              const item = SHOP_ITEMS.find((i) => i.id === id)
              if (!item) return null
              const eq = equipped[item.category] === item.id
              return (
                <span key={id} className={`text-[11px] px-2 py-1 rounded-full border ${eq ? 'border-text-primary dark:border-white/30 text-text-primary dark:text-dark-text-primary' : 'border-border dark:border-white/10 text-text-muted'}`}>
                  {eq && <Check size={8} className="inline mr-0.5" />}{item.name}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
