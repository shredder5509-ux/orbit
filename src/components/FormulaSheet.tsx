import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Plus, Trash2 } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface Formula {
  id: string
  label: string
  formula: string
}

interface FormulaSection {
  subject: string
  formulas: Formula[]
}

const BUILT_IN: FormulaSection[] = [
  {
    subject: 'Maths',
    formulas: [
      { id: 'm1', label: 'Quadratic formula', formula: 'x = (-b ± √(b²-4ac)) / 2a' },
      { id: 'm2', label: 'Pythagoras', formula: 'a² + b² = c²' },
      { id: 'm3', label: 'Area of circle', formula: 'A = πr²' },
      { id: 'm4', label: 'Circumference', formula: 'C = 2πr' },
      { id: 'm5', label: 'Area of triangle', formula: 'A = ½ × b × h' },
      { id: 'm6', label: 'Volume of sphere', formula: 'V = (4/3)πr³' },
      { id: 'm7', label: 'Gradient', formula: 'm = (y₂-y₁) / (x₂-x₁)' },
      { id: 'm8', label: 'sin rule', formula: 'a/sinA = b/sinB = c/sinC' },
      { id: 'm9', label: 'cos rule', formula: 'a² = b² + c² - 2bc·cosA' },
    ],
  },
  {
    subject: 'Physics',
    formulas: [
      { id: 'p1', label: 'Speed', formula: 'v = d / t' },
      { id: 'p2', label: "Newton's 2nd law", formula: 'F = m × a' },
      { id: 'p3', label: 'Weight', formula: 'W = m × g' },
      { id: 'p4', label: 'Kinetic energy', formula: 'KE = ½mv²' },
      { id: 'p5', label: 'GPE', formula: 'GPE = m × g × h' },
      { id: 'p6', label: "Ohm's law", formula: 'V = I × R' },
      { id: 'p7', label: 'Power', formula: 'P = E / t' },
      { id: 'p8', label: 'Wave speed', formula: 'v = f × λ' },
    ],
  },
  {
    subject: 'Chemistry',
    formulas: [
      { id: 'c1', label: 'Moles', formula: 'n = m / Mr' },
      { id: 'c2', label: 'Concentration', formula: 'c = n / V' },
      { id: 'c3', label: 'Atom economy', formula: '(Mr useful / Mr total) × 100%' },
      { id: 'c4', label: 'Percentage yield', formula: '(actual / theoretical) × 100%' },
    ],
  },
]

const STORAGE_KEY = 'orbit-custom-formulas'

function getCustomFormulas(): Formula[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveCustomFormulas(formulas: Formula[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formulas))
}

interface FormulaSheetProps {
  open: boolean
  onClose: () => void
}

export function FormulaSheet({ open, onClose }: FormulaSheetProps) {
  const [customFormulas, setCustomFormulas] = useState<Formula[]>(getCustomFormulas)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newFormula, setNewFormula] = useState('')

  const addCustom = () => {
    if (!newLabel.trim() || !newFormula.trim()) return
    const updated = [...customFormulas, { id: 'custom-' + Date.now(), label: newLabel.trim(), formula: newFormula.trim() }]
    setCustomFormulas(updated)
    saveCustomFormulas(updated)
    setNewLabel('')
    setNewFormula('')
    setAdding(false)
  }

  const removeCustom = (id: string) => {
    const updated = customFormulas.filter((f) => f.id !== id)
    setCustomFormulas(updated)
    saveCustomFormulas(updated)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/15 px-4 pb-0 sm:pb-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-border/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-text-primary" />
                <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Formula Sheet</h2>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
            </div>

            <div className="p-4 space-y-4">
              {BUILT_IN.map((section) => (
                <div key={section.subject}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">{section.subject}</p>
                  <div className="space-y-1">
                    {section.formulas.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-accent-light/30">
                        <span className="text-[11px] text-text-muted flex-1">{f.label}</span>
                        <code className="text-[11px] text-text-primary font-mono bg-pastel-blue/30 px-1.5 py-0.5 rounded">{f.formula}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom formulas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Your Formulas</p>
                  <button onClick={() => setAdding(!adding)} className="text-[10px] text-text-muted hover:text-text-primary flex items-center gap-0.5">
                    <Plus size={10} /> Add
                  </button>
                </div>

                {adding && (
                  <Card padding="sm" className="mb-2">
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Label (e.g. Area of trapezium)"
                      className="w-full px-2 py-1.5 mb-1.5 text-[11px] border border-border rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <input
                      value={newFormula}
                      onChange={(e) => setNewFormula(e.target.value)}
                      placeholder="Formula (e.g. A = ½(a+b)h)"
                      className="w-full px-2 py-1.5 mb-2 text-[11px] border border-border rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
                    />
                    <Button size="sm" onClick={addCustom} disabled={!newLabel.trim() || !newFormula.trim()}>Save</Button>
                  </Card>
                )}

                {customFormulas.length === 0 && !adding ? (
                  <p className="text-[10px] text-text-muted text-center py-2">Add your own formulas here.</p>
                ) : (
                  <div className="space-y-1">
                    {customFormulas.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-accent-light/30 group">
                        <span className="text-[11px] text-text-muted flex-1">{f.label}</span>
                        <code className="text-[11px] text-text-primary font-mono bg-pastel-yellow/30 px-1.5 py-0.5 rounded">{f.formula}</code>
                        <button onClick={() => removeCustom(f.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
