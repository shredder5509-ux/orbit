import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

type Tab = 'periodic' | 'physics' | 'chemistry'

// Simplified periodic table data (first 36 elements)
const ELEMENTS = [
  { n: 1, sym: 'H', name: 'Hydrogen', mass: 1.008, group: 'nonmetal' },
  { n: 2, sym: 'He', name: 'Helium', mass: 4.003, group: 'noble' },
  { n: 3, sym: 'Li', name: 'Lithium', mass: 6.941, group: 'alkali' },
  { n: 4, sym: 'Be', name: 'Beryllium', mass: 9.012, group: 'alkaline' },
  { n: 5, sym: 'B', name: 'Boron', mass: 10.81, group: 'metalloid' },
  { n: 6, sym: 'C', name: 'Carbon', mass: 12.01, group: 'nonmetal' },
  { n: 7, sym: 'N', name: 'Nitrogen', mass: 14.01, group: 'nonmetal' },
  { n: 8, sym: 'O', name: 'Oxygen', mass: 16.00, group: 'nonmetal' },
  { n: 9, sym: 'F', name: 'Fluorine', mass: 19.00, group: 'halogen' },
  { n: 10, sym: 'Ne', name: 'Neon', mass: 20.18, group: 'noble' },
  { n: 11, sym: 'Na', name: 'Sodium', mass: 22.99, group: 'alkali' },
  { n: 12, sym: 'Mg', name: 'Magnesium', mass: 24.31, group: 'alkaline' },
  { n: 13, sym: 'Al', name: 'Aluminium', mass: 26.98, group: 'metal' },
  { n: 14, sym: 'Si', name: 'Silicon', mass: 28.09, group: 'metalloid' },
  { n: 15, sym: 'P', name: 'Phosphorus', mass: 30.97, group: 'nonmetal' },
  { n: 16, sym: 'S', name: 'Sulfur', mass: 32.07, group: 'nonmetal' },
  { n: 17, sym: 'Cl', name: 'Chlorine', mass: 35.45, group: 'halogen' },
  { n: 18, sym: 'Ar', name: 'Argon', mass: 39.95, group: 'noble' },
  { n: 19, sym: 'K', name: 'Potassium', mass: 39.10, group: 'alkali' },
  { n: 20, sym: 'Ca', name: 'Calcium', mass: 40.08, group: 'alkaline' },
  { n: 26, sym: 'Fe', name: 'Iron', mass: 55.85, group: 'transition' },
  { n: 29, sym: 'Cu', name: 'Copper', mass: 63.55, group: 'transition' },
  { n: 30, sym: 'Zn', name: 'Zinc', mass: 65.38, group: 'transition' },
  { n: 35, sym: 'Br', name: 'Bromine', mass: 79.90, group: 'halogen' },
  { n: 47, sym: 'Ag', name: 'Silver', mass: 107.87, group: 'transition' },
  { n: 79, sym: 'Au', name: 'Gold', mass: 196.97, group: 'transition' },
]

const GROUP_COLORS: Record<string, string> = {
  alkali: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800/30',
  alkaline: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30',
  transition: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30',
  metal: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30',
  metalloid: 'bg-teal-100 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/30',
  nonmetal: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800/30',
  halogen: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30',
  noble: 'bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/30',
}

interface PhysicsFormula {
  name: string
  formula: string
  variables: string
  unit: string
}

const PHYSICS_FORMULAS: PhysicsFormula[] = [
  { name: 'Speed', formula: 'v = d ÷ t', variables: 'v=speed, d=distance, t=time', unit: 'm/s' },
  { name: 'Acceleration', formula: 'a = (v−u) ÷ t', variables: 'a=accel, v=final, u=initial, t=time', unit: 'm/s²' },
  { name: 'Force', formula: 'F = m × a', variables: 'F=force, m=mass, a=accel', unit: 'N' },
  { name: 'Weight', formula: 'W = m × g', variables: 'W=weight, m=mass, g=9.8', unit: 'N' },
  { name: 'Work done', formula: 'W = F × d', variables: 'W=work, F=force, d=distance', unit: 'J' },
  { name: 'Power', formula: 'P = W ÷ t', variables: 'P=power, W=work, t=time', unit: 'W' },
  { name: 'Kinetic energy', formula: 'KE = ½mv²', variables: 'KE=energy, m=mass, v=velocity', unit: 'J' },
  { name: 'GPE', formula: 'GPE = mgh', variables: 'GPE=energy, m=mass, g=9.8, h=height', unit: 'J' },
  { name: 'Density', formula: 'ρ = m ÷ V', variables: 'ρ=density, m=mass, V=volume', unit: 'kg/m³' },
  { name: 'Pressure', formula: 'P = F ÷ A', variables: 'P=pressure, F=force, A=area', unit: 'Pa' },
  { name: 'Ohm\'s Law', formula: 'V = I × R', variables: 'V=voltage, I=current, R=resistance', unit: 'V' },
  { name: 'Electrical power', formula: 'P = I × V', variables: 'P=power, I=current, V=voltage', unit: 'W' },
  { name: 'Wave speed', formula: 'v = f × λ', variables: 'v=speed, f=frequency, λ=wavelength', unit: 'm/s' },
  { name: 'Efficiency', formula: 'η = useful ÷ total × 100', variables: 'η=efficiency', unit: '%' },
]

interface ChemFormula {
  name: string
  formula: string
  use: string
}

const CHEM_FORMULAS: ChemFormula[] = [
  { name: 'Moles', formula: 'n = m ÷ Mr', use: 'n=moles, m=mass(g), Mr=relative molecular mass' },
  { name: 'Concentration', formula: 'c = n ÷ V', use: 'c=mol/dm³, n=moles, V=volume in dm³' },
  { name: 'Atom economy', formula: '(Mr of desired ÷ Mr of all products) × 100', use: 'Efficiency of reaction' },
  { name: 'Percentage yield', formula: '(actual yield ÷ theoretical yield) × 100', use: 'How much product was made' },
  { name: 'Relative formula mass', formula: 'Sum of Ar of all atoms', use: 'Use periodic table Ar values' },
  { name: 'Mean rate', formula: 'quantity of product ÷ time', use: 'g/s or cm³/s' },
]

export function ScienceCalcPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('periodic')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof ELEMENTS[0] | null>(null)

  const filteredElements = ELEMENTS.filter((el) =>
    el.name.toLowerCase().includes(search.toLowerCase()) ||
    el.sym.toLowerCase().includes(search.toLowerCase()) ||
    el.n.toString() === search
  )

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-3">Science Reference</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {([['periodic', 'Periodic Table'], ['physics', 'Physics'], ['chemistry', 'Chemistry']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[11px] rounded-[var(--radius-md)] border transition-all ${tab === t ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'periodic' && (
        <>
          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search elements..."
              className="w-full pl-8 pr-3 py-2 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(GROUP_COLORS).map(([group, cls]) => (
              <span key={group} className={`px-1.5 py-0.5 text-[8px] rounded border ${cls} capitalize text-text-muted`}>{group}</span>
            ))}
          </div>

          {/* Selected element detail */}
          {selected && (
            <Card className="mb-3" pastel="#E8F0FE30">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[var(--radius-md)] border flex flex-col items-center justify-center ${GROUP_COLORS[selected.group]}`}>
                  <span className="text-[8px] text-text-muted">{selected.n}</span>
                  <span className="text-base font-semibold text-text-primary dark:text-dark-text-primary">{selected.sym}</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-text-primary dark:text-dark-text-primary">{selected.name}</p>
                  <p className="text-[10px] text-text-muted">Atomic number: {selected.n} · Mass: {selected.mass} · Group: {selected.group}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Elements grid */}
          <div className="grid grid-cols-6 gap-1">
            {filteredElements.map((el) => (
              <motion.button key={el.n} onClick={() => setSelected(el)}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-1.5 rounded-[var(--radius-sm)] border text-center transition-all hover:scale-105 ${GROUP_COLORS[el.group]} ${selected?.n === el.n ? 'ring-1 ring-text-primary' : ''}`}>
                <span className="text-[7px] text-text-muted block">{el.n}</span>
                <span className="text-[12px] font-semibold text-text-primary dark:text-dark-text-primary block">{el.sym}</span>
                <span className="text-[7px] text-text-muted block">{el.mass}</span>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {tab === 'physics' && (
        <div className="space-y-1.5">
          {PHYSICS_FORMULAS.map((f) => (
            <Card key={f.name} padding="sm">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-text-primary dark:text-dark-text-primary">{f.name}</p>
                  <p className="text-[14px] font-mono text-text-primary dark:text-dark-text-primary">{f.formula}</p>
                  <p className="text-[9px] text-text-muted">{f.variables}</p>
                </div>
                <span className="text-[10px] text-text-muted px-1.5 py-0.5 bg-accent-light/30 dark:bg-white/5 rounded">{f.unit}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'chemistry' && (
        <div className="space-y-1.5">
          {CHEM_FORMULAS.map((f) => (
            <Card key={f.name} padding="sm">
              <p className="text-[12px] font-medium text-text-primary dark:text-dark-text-primary">{f.name}</p>
              <p className="text-[14px] font-mono text-text-primary dark:text-dark-text-primary">{f.formula}</p>
              <p className="text-[9px] text-text-muted">{f.use}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
