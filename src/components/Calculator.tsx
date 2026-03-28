import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calculator as CalcIcon } from 'lucide-react'

interface CalculatorProps {
  open: boolean
  onClose: () => void
}

const BUTTONS = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '±', '='],
]

const SCIENTIFIC = [
  ['sin', 'cos', 'tan', 'π'],
  ['√', 'x²', 'xⁿ', 'e'],
  ['log', 'ln', '%', 'DEL'],
]

export function Calculator({ open, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [showScientific, setShowScientific] = useState(false)

  const handleButton = (btn: string) => {
    switch (btn) {
      case 'C':
        setDisplay('0')
        setExpression('')
        break
      case 'DEL':
        setDisplay((d) => d.length > 1 ? d.slice(0, -1) : '0')
        break
      case '=':
        try {
          const expr = expression + display
          const sanitized = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, `${Math.PI}`)
            .replace(/e(?![x])/g, `${Math.E}`)
          const result = Function('"use strict"; return (' + sanitized + ')')()
          setDisplay(String(Math.round(result * 1e10) / 1e10))
          setExpression('')
        } catch {
          setDisplay('Error')
          setExpression('')
        }
        break
      case '±':
        setDisplay((d) => d.startsWith('-') ? d.slice(1) : '-' + d)
        break
      case '+': case '-': case '×': case '÷':
        setExpression((e) => e + display + btn)
        setDisplay('0')
        break
      case '(': case ')':
        setExpression((e) => e + btn)
        break
      case 'sin': case 'cos': case 'tan': case 'log': case 'ln':
        try {
          const val = parseFloat(display)
          const fns: Record<string, (n: number) => number> = {
            sin: Math.sin, cos: Math.cos, tan: Math.tan,
            log: Math.log10, ln: Math.log,
          }
          setDisplay(String(Math.round(fns[btn](val) * 1e10) / 1e10))
        } catch { setDisplay('Error') }
        break
      case '√':
        setDisplay(String(Math.round(Math.sqrt(parseFloat(display)) * 1e10) / 1e10))
        break
      case 'x²':
        setDisplay(String(Math.pow(parseFloat(display), 2)))
        break
      case 'xⁿ':
        setExpression((e) => e + display + '**')
        setDisplay('0')
        break
      case 'π':
        setDisplay(String(Math.PI))
        break
      case 'e':
        setDisplay(String(Math.E))
        break
      case '%':
        setDisplay(String(parseFloat(display) / 100))
        break
      default:
        setDisplay((d) => d === '0' ? btn : d + btn)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border rounded-t-[var(--radius-xl)] shadow-xl shadow-black/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CalcIcon size={14} className="text-text-primary" />
              <span className="text-[12px] font-medium text-text-primary">Calculator</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScientific(!showScientific)}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${showScientific ? 'bg-text-primary text-white' : 'text-text-muted border border-border'}`}
              >
                SCI
              </button>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="px-4 py-3 text-right">
            <p className="text-[10px] text-text-muted h-4 overflow-hidden">{expression}</p>
            <p className="text-2xl font-semibold text-text-primary font-mono tracking-wide">{display}</p>
          </div>

          {/* Scientific buttons */}
          {showScientific && (
            <div className="px-3 pb-1">
              {SCIENTIFIC.map((row, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  {row.map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleButton(btn)}
                      className="flex-1 py-2 text-[11px] font-medium rounded-[var(--radius-md)] bg-pastel-purple/30 text-text-primary hover:bg-pastel-purple/50 active:scale-95 transition-all"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Main buttons */}
          <div className="px-3 pb-4">
            {BUTTONS.map((row, i) => (
              <div key={i} className="flex gap-1.5 mb-1.5">
                {row.map((btn) => {
                  const isOp = ['+', '-', '×', '÷', '='].includes(btn)
                  const isSpecial = ['C', '(', ')'].includes(btn)
                  return (
                    <button
                      key={btn}
                      onClick={() => handleButton(btn)}
                      className={`flex-1 py-3 text-[14px] font-medium rounded-[var(--radius-md)] active:scale-95 transition-all ${
                        btn === '='
                          ? 'bg-text-primary text-white'
                          : isOp
                          ? 'bg-pastel-blue/40 text-text-primary hover:bg-pastel-blue/60'
                          : isSpecial
                          ? 'bg-pastel-pink/30 text-text-primary hover:bg-pastel-pink/50'
                          : 'bg-accent-light text-text-primary hover:bg-border/30'
                      }`}
                    >
                      {btn}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
