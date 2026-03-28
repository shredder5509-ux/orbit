import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Volume2, Loader2 } from 'lucide-react'

interface DictionaryResult {
  word: string
  phonetic?: string
  meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]
  synonyms: string[]
}

async function lookupWord(word: string): Promise<DictionaryResult | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!res.ok) return null
    const data = await res.json()
    const entry = data[0]
    if (!entry) return null

    const synonyms = new Set<string>()
    const meanings = entry.meanings.map((m: any) => {
      m.synonyms?.forEach((s: string) => synonyms.add(s))
      return {
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 2).map((d: any) => ({
          definition: d.definition,
          example: d.example,
        })),
      }
    })

    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
      meanings,
      synonyms: Array.from(synonyms).slice(0, 6),
    }
  } catch {
    return null
  }
}

function speakWord(word: string) {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.rate = 0.8
  utterance.lang = 'en-GB'
  window.speechSynthesis.speak(utterance)
}

interface DictionaryLookupProps {
  open: boolean
  onClose: () => void
  initialWord?: string
}

export function DictionaryLookup({ open, onClose, initialWord = '' }: DictionaryLookupProps) {
  const [query, setQuery] = useState(initialWord)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)
    const r = await lookupWord(query.trim())
    if (r) {
      setResult(r)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/15 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md max-h-[70vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-border/50 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-text-primary">Dictionary</h2>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Look up a word..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 text-[12px] rounded-[var(--radius-md)] border border-border bg-white dark:bg-dark-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || loading}
                  className="px-3 py-2 bg-text-primary text-white rounded-[var(--radius-md)] text-[11px] font-medium hover:opacity-80 disabled:opacity-30"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Look up'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="p-4">
              {loading && (
                <div className="text-center py-6">
                  <Loader2 className="animate-spin mx-auto text-text-muted" size={18} />
                </div>
              )}

              {notFound && (
                <div className="text-center py-6">
                  <p className="text-[12px] text-text-muted">Couldn't find "{query}". Check the spelling?</p>
                </div>
              )}

              {result && (
                <div>
                  {/* Word + phonetic */}
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">{result.word}</h3>
                    {result.phonetic && (
                      <span className="text-[11px] text-text-muted">{result.phonetic}</span>
                    )}
                    <button
                      onClick={() => speakWord(result.word)}
                      className="p-1 text-text-muted hover:text-text-primary transition-colors"
                      title="Pronounce"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>

                  {/* Meanings */}
                  <div className="space-y-3">
                    {result.meanings.map((m, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide italic mb-1">{m.partOfSpeech}</p>
                        <ol className="space-y-1.5 list-decimal list-inside">
                          {m.definitions.map((d, j) => (
                            <li key={j} className="text-[12px] text-text-primary leading-relaxed">
                              {d.definition}
                              {d.example && (
                                <p className="text-[11px] text-text-muted italic ml-4 mt-0.5">"{d.example}"</p>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>

                  {/* Synonyms */}
                  {result.synonyms.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Synonyms</p>
                      <div className="flex flex-wrap gap-1">
                        {result.synonyms.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setQuery(s); lookupWord(s).then((r) => r && setResult(r)) }}
                            className="text-[10px] px-2 py-0.5 bg-pastel-blue/40 text-text-primary rounded-full hover:bg-pastel-blue/60 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && !result && !notFound && (
                <p className="text-[11px] text-text-muted text-center py-6">Type a word and tap "Look up"</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
