import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RotateCcw, ChevronLeft, Sparkles, Check, X, BookOpen, Loader2, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelScene } from '../components/RetroIllustrations'
import { useFlashcardStore, type FlashcardDeck, type Flashcard } from '../stores/flashcardStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDataStore } from '../stores/dataStore'
import { useAnalyticsStore } from '../stores/analyticsStore'

type View = 'decks' | 'study' | 'create' | 'ai-generate'

export function FlashcardsPage() {
  const navigate = useNavigate()
  const { decks, addDeck, addCardToDeck, updateCardReview, markDeckStudied, getDueCards, getMasteryPercent } = useFlashcardStore()
  const { plan } = useSubscriptionStore()
  const { apiKey } = useSettingsStore()
  const { addStudyMinutes } = useDataStore()
  const { track } = useAnalyticsStore()
  const isPro = plan !== 'free'

  const [view, setView] = useState<View>('decks')
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([])
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [showResults, setShowResults] = useState(false)

  // Create deck form (manual)
  const [newDeckName, setNewDeckName] = useState('')
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [newDeckCards, setNewDeckCards] = useState<{ front: string; back: string }[]>([])

  // AI generation
  const [aiTopic, setAiTopic] = useState('')
  const [aiContext, setAiContext] = useState('')
  const [aiCardCount, setAiCardCount] = useState(10)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiPreview, setAiPreview] = useState<{ front: string; back: string; difficulty: string }[]>([])

  const dueCards = getDueCards()

  const generateFlashcardsAI = async () => {
    if (!aiTopic.trim() || !apiKey) return
    setAiGenerating(true)
    setAiError('')
    setAiPreview([])

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: `Generate exactly ${aiCardCount} flashcards for a 13-year-old student studying the topic described below.

Mix question types:
- Key definitions ("What is...?")
- Application questions ("What would happen if...?")
- Fill-in-the-blank ("The process of ___ converts...")
- Quick recall ("Name three types of...")
- "Why" questions ("Why does...?")

For each card:
- front: concise question or prompt (1-2 sentences max)
- back: clear, concise answer (1-3 sentences max)
- difficulty: "easy" (basic recall), "medium" (apply knowledge), or "hard" (analyse/connect)

Return ONLY a valid JSON array of objects with keys: front, back, difficulty.
No explanation, no markdown — just the JSON array.`,
          messages: [{
            role: 'user',
            content: aiContext.trim()
              ? `Topic: ${aiTopic}\n\nAdditional context/syllabus:\n${aiContext}`
              : `Topic: ${aiTopic}`,
          }],
        }),
      })

      if (!response.ok) throw new Error('Failed to generate flashcards')

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Could not parse generated cards')

      const cards = JSON.parse(jsonMatch[0])
      if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards generated')

      setAiPreview(cards.map((c: any) => ({
        front: c.front || '',
        back: c.back || '',
        difficulty: c.difficulty || 'medium',
      })))

      track('flashcard_ai_generated', { topic: aiTopic, count: cards.length })
    } catch (err: any) {
      setAiError(err.message || 'Something went wrong. Try again?')
    } finally {
      setAiGenerating(false)
    }
  }

  const saveAiDeck = () => {
    if (aiPreview.length === 0) return
    const deckName = aiTopic.trim()
    const deckId = addDeck({ topicId: '', subjectName: 'AI Generated', name: deckName, cards: [] })
    aiPreview.forEach((c) => {
      addCardToDeck(deckId, {
        topicId: '',
        front: c.front,
        back: c.back,
        difficulty: (c.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        tags: [aiTopic],
      })
    })
    setAiTopic('')
    setAiContext('')
    setAiPreview([])
    setView('decks')
  }

  const startStudy = (deck: FlashcardDeck) => {
    const cards = [...deck.cards].sort(() => Math.random() - 0.5)
    setActiveDeck(deck)
    setSessionCards(cards)
    setCardIndex(0)
    setFlipped(false)
    setSessionCorrect(0)
    setShowResults(false)
    setView('study')
    track('flashcard_studied', { deckId: deck.id })
  }

  const handleRate = (correct: boolean) => {
    if (!activeDeck) return
    const card = sessionCards[cardIndex]
    updateCardReview(activeDeck.id, card.id, correct)
    if (correct) setSessionCorrect((c) => c + 1)

    if (cardIndex + 1 >= sessionCards.length) {
      markDeckStudied(activeDeck.id)
      addStudyMinutes(Math.max(1, Math.round(sessionCards.length * 0.5)))
      setShowResults(true)
    } else {
      setCardIndex((i) => i + 1)
      setFlipped(false)
    }
  }

  const handleCreateDeck = () => {
    if (!newDeckName.trim() || newDeckCards.length === 0) return
    const deckId = addDeck({ topicId: '', subjectName: 'Custom', name: newDeckName, cards: [] })
    newDeckCards.forEach((c) => {
      addCardToDeck(deckId, { topicId: '', front: c.front, back: c.back, difficulty: 'medium', tags: [] })
    })
    setNewDeckName('')
    setNewDeckCards([])
    setView('decks')
  }

  const addCardToNewDeck = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return
    setNewDeckCards((c) => [...c, { front: newCardFront, back: newCardBack }])
    setNewCardFront('')
    setNewCardBack('')
  }

  // Study view
  if (view === 'study' && activeDeck && !showResults) {
    const card = sessionCards[cardIndex]
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView('decks')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-[11px] text-text-muted bg-pastel-blue/40 px-2 py-0.5 rounded-full">
            {cardIndex + 1}/{sessionCards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border/50 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-text-primary rounded-full transition-all" style={{ width: `${((cardIndex + 1) / sessionCards.length) * 100}%` }} />
        </div>

        {/* Card */}
        <motion.div
          key={cardIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <Card className="min-h-[200px] flex flex-col items-center justify-center text-center" pastel={flipped ? '#E6F7ED30' : '#E8F0FE30'}>
            <p className="text-[9px] text-text-muted uppercase tracking-wide mb-3">
              {flipped ? 'Answer' : 'Question'} · tap to flip
            </p>
            <p className="text-[15px] text-text-primary dark:text-dark-text-primary font-medium leading-relaxed px-4">
              {flipped ? card.back : card.front}
            </p>
          </Card>
        </motion.div>

        {/* Rate buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mt-4"
            >
              <Button variant="secondary" className="flex-1" onClick={() => handleRate(false)}>
                <RotateCcw size={12} /> Again
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => handleRate(true)}>
                Hard
              </Button>
              <Button className="flex-1" onClick={() => handleRate(true)}>
                <Check size={12} /> Got it
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Results view
  if (view === 'study' && showResults) {
    const accuracy = sessionCards.length > 0 ? Math.round((sessionCorrect / sessionCards.length) * 100) : 0
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6 text-center">
        <PixelScene variant="minimal" />
        <div className="relative z-10 pt-8">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Deck complete!</h2>
          <p className="text-sm text-text-muted mb-6">{activeDeck?.name}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card pastel="#E6F7ED40" className="text-center">
              <p className="text-2xl font-bold text-text-primary">{sessionCorrect}/{sessionCards.length}</p>
              <p className="text-[10px] text-text-muted uppercase">Correct</p>
            </Card>
            <Card pastel="#E8F0FE40" className="text-center">
              <p className="text-2xl font-bold text-text-primary">{accuracy}%</p>
              <p className="text-[10px] text-text-muted uppercase">Accuracy</p>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => startStudy(activeDeck!)}>
              <RotateCcw size={12} /> Study Again
            </Button>
            <Button className="flex-1" onClick={() => setView('decks')}>
              Done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // AI Generate view
  if (view === 'ai-generate') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setAiPreview([]); setAiError(''); setView('decks') }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="text-sm font-semibold text-text-primary">AI Flashcards</h1>
          <div />
        </div>

        {aiPreview.length === 0 ? (
          <>
            {/* Topic input */}
            <Card className="mb-4" pastel="#F0E6FF20">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={14} className="text-text-primary" />
                <p className="text-[13px] font-semibold text-text-primary">Describe your topic</p>
              </div>
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. GCSE Biology — Cell division and mitosis"
                autoFocus
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors mb-3"
              />
              <textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="(Optional) Paste syllabus points, textbook text, or notes to make the cards more specific..."
                rows={4}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-[12px] focus:outline-none focus:border-text-primary transition-colors resize-none mb-3"
              />

              {/* Card count */}
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Number of cards</p>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAiCardCount(n)}
                    className={`flex-1 py-1.5 text-[12px] rounded-[var(--radius-md)] transition-colors ${
                      aiCardCount === n
                        ? 'bg-text-primary text-white'
                        : 'border border-border text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Card>

            {aiError && (
              <p className="text-[12px] text-error mb-3 text-center">{aiError}</p>
            )}

            <Button
              onClick={generateFlashcardsAI}
              disabled={!aiTopic.trim() || aiGenerating || !apiKey}
              className="w-full"
              size="lg"
            >
              {aiGenerating ? (
                <><Loader2 size={14} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={14} /> Generate {aiCardCount} Flashcards</>
              )}
            </Button>

            {!apiKey && (
              <p className="text-[10px] text-text-muted text-center mt-2">
                Add your API key in Settings first.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Preview generated cards */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-text-primary">
                {aiPreview.length} cards generated
              </p>
              <button
                onClick={() => { setAiPreview([]); setAiError('') }}
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Regenerate
              </button>
            </div>

            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
              {aiPreview.map((card, i) => (
                <Card key={i} padding="sm">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-text-muted mt-0.5 shrink-0 w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-primary font-medium mb-0.5">{card.front}</p>
                      <p className="text-[11px] text-text-muted">{card.back}</p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      card.difficulty === 'easy' ? 'bg-pastel-green/50 text-text-secondary'
                        : card.difficulty === 'hard' ? 'bg-pastel-pink/50 text-text-secondary'
                        : 'bg-pastel-yellow/50 text-text-secondary'
                    }`}>
                      {card.difficulty}
                    </span>
                    <button
                      onClick={() => setAiPreview((p) => p.filter((_, j) => j !== i))}
                      className="text-text-muted hover:text-error shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={saveAiDeck} className="w-full" size="lg">
              <Check size={14} /> Save Deck — {aiPreview.length} cards
            </Button>
          </>
        )}
      </div>
    )
  }

  // Manual create view
  if (view === 'create') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView('decks')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="text-sm font-semibold text-text-primary">Create Deck</h1>
          <div />
        </div>

        <input
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          placeholder="Deck name..."
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors mb-4"
        />

        {/* Add card form */}
        <Card className="mb-4" pastel="#FFF8E130">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">New Card</p>
          <input
            value={newCardFront}
            onChange={(e) => setNewCardFront(e.target.value)}
            placeholder="Front (question)..."
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors mb-2"
          />
          <input
            value={newCardBack}
            onChange={(e) => setNewCardBack(e.target.value)}
            placeholder="Back (answer)..."
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors mb-2"
          />
          <Button variant="secondary" size="sm" onClick={addCardToNewDeck} disabled={!newCardFront.trim() || !newCardBack.trim()}>
            <Plus size={12} /> Add Card
          </Button>
        </Card>

        {/* Cards list */}
        {newDeckCards.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {newDeckCards.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 border border-border/50 rounded-[var(--radius-md)]">
                <span className="text-[11px] text-text-muted w-5">{i + 1}.</span>
                <span className="text-[12px] text-text-primary flex-1 truncate">{c.front}</span>
                <button onClick={() => setNewDeckCards((d) => d.filter((_, j) => j !== i))} className="text-text-muted hover:text-error">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleCreateDeck} disabled={!newDeckName.trim() || newDeckCards.length === 0} className="w-full">
          Create Deck ({newDeckCards.length} cards)
        </Button>
      </div>
    )
  }

  // Decks list view
  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">Flashcards</h1>
          <div className="flex gap-1.5">
            <Button variant="pastel" size="sm" onClick={() => setView('ai-generate')}>
              <Sparkles size={10} /> AI Generate
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setView('create')}>
              <Plus size={10} /> Manual
            </Button>
          </div>
        </div>

        {/* Due cards banner */}
        {dueCards.length > 0 && (
          <Card className="mb-4 cursor-pointer hover:shadow-sm transition-shadow" pastel="#FFF8E140" onClick={() => {
            // Quick study: random 10 due cards
            const shuffled = dueCards.sort(() => Math.random() - 0.5).slice(0, 10)
            if (shuffled.length > 0) {
              const fakeDeck: FlashcardDeck = {
                id: 'quick', topicId: '', subjectName: 'Mixed', name: 'Quick Review',
                cards: shuffled.map((d) => d.card), createdAt: '', lastStudied: null,
              }
              startStudy(fakeDeck)
            }
          }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-pastel-yellow/60 flex items-center justify-center">
                <RotateCcw size={14} className="text-text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-text-primary">{dueCards.length} cards due for review</p>
                <p className="text-[10px] text-text-muted">Tap to start a quick session</p>
              </div>
            </div>
          </Card>
        )}

        {/* AI generation hint for new users */}
        {decks.length === 0 && dueCards.length === 0 && (
          <Card className="mb-4 text-center cursor-pointer hover:shadow-sm transition-shadow" pastel="#F0E6FF20" onClick={() => setView('ai-generate')}>
            <Sparkles size={16} className="mx-auto mb-1.5 text-text-muted" />
            <p className="text-[12px] text-text-primary font-medium mb-0.5">Generate flashcards with AI</p>
            <p className="text-[10px] text-text-muted">Just describe a topic or paste a syllabus — the AI does the rest.</p>
          </Card>
        )}

        {/* Deck list */}
        {decks.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen className="mx-auto mb-2 text-text-muted" size={24} />
            <p className="text-sm text-text-muted mb-1">No flashcard decks yet</p>
            <p className="text-[11px] text-text-muted">Create your first deck to start studying</p>
          </div>
        ) : (
          <div className="space-y-2">
            {decks.map((deck) => {
              const mastery = getMasteryPercent(deck.id)
              return (
                <motion.div key={deck.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className="cursor-pointer hover:shadow-sm transition-all"
                    onClick={() => startStudy(deck)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary truncate">{deck.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {deck.cards.length} cards · {deck.subjectName}
                          {deck.lastStudied && ` · Last: ${new Date(deck.lastStudied).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-text-primary">{mastery}%</p>
                        <p className="text-[9px] text-text-muted uppercase">Mastery</p>
                      </div>
                    </div>
                    {/* Mastery bar */}
                    <div className="h-1 bg-border/30 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-success/60 rounded-full transition-all" style={{ width: `${mastery}%` }} />
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
