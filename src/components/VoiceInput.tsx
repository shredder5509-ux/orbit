import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

// Voice-to-text input button
export function VoiceInputButton({ onTranscript, disabled }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-GB'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening, onTranscript])

  // Check if speech recognition is available
  const isAvailable = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )

  if (!isAvailable) return null

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-[var(--radius-md)] transition-all ${
        isListening
          ? 'bg-error/10 text-error animate-pulse'
          : 'text-text-muted hover:text-text-primary hover:bg-accent-light/50'
      } disabled:opacity-30`}
      title={isListening ? 'Stop listening' : 'Speak your answer'}
    >
      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  )
}

// Text-to-speech button for tutor messages
export function SpeakButton({ text }: { text: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.lang = 'en-GB'
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  if (!window.speechSynthesis) return null

  return (
    <button
      onClick={handleSpeak}
      className={`p-0.5 rounded transition-colors ${
        isSpeaking ? 'text-text-primary' : 'text-text-muted/40 hover:text-text-muted'
      }`}
      title={isSpeaking ? 'Stop' : 'Read aloud'}
    >
      <Volume2 size={10} />
    </button>
  )
}
