import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileText, Type, Link as LinkIcon, Upload, X, Check, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelScene } from '../components/RetroIllustrations'
import { useUploadStore } from '../stores/uploadStore'

type UploadStatus = 'processing' | 'ready' | 'error'
type UploadType = 'photo' | 'pdf' | 'text' | 'link'
type ModalType = 'text' | 'link' | null

const methodConfig = [
  { icon: Camera, label: 'Take Photo', description: 'Snap a worksheet', pastel: '#FDE8EC' },
  { icon: FileText, label: 'Upload PDF', description: 'Drop in a document', pastel: '#E8F0FE' },
  { icon: Type, label: 'Paste Text', description: 'Type or paste content', pastel: '#FFF8E1' },
  { icon: LinkIcon, label: 'Add Link', description: 'Import from the web', pastel: '#E6F7ED' },
]

export function UploadPage() {
  const navigate = useNavigate()
  const { uploads, addUpload, removeUpload } = useUploadStore()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [textInput, setTextInput] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const navigateToSession = useCallback((uploadId: string) => {
    navigate(`/session/${uploadId}`)
  }, [navigate])

  const handleFileUpload = (files: FileList | null, type: 'photo' | 'pdf') => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        addUpload({ type, name: file.name, content: reader.result as string })
        const store = useUploadStore.getState()
        const latest = store.uploads[0]
        if (latest) navigateToSession(latest.id)
      }
      reader.readAsText(file)
    })
  }

  const handleTextSubmit = () => {
    if (!textInput.trim()) return
    addUpload({ type: 'text', name: `Text note — ${new Date().toLocaleDateString()}`, content: textInput.trim() })
    const store = useUploadStore.getState()
    const latest = store.uploads[0]
    setTextInput('')
    setActiveModal(null)
    if (latest) navigateToSession(latest.id)
  }

  const handleLinkSubmit = () => {
    if (!linkInput.trim()) return
    addUpload({ type: 'link', name: linkInput.trim(), content: linkInput.trim() })
    const store = useUploadStore.getState()
    const latest = store.uploads[0]
    setLinkInput('')
    setActiveModal(null)
    if (latest) navigateToSession(latest.id)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files, 'pdf')
  }, [])

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'processing': return <Loader2 size={13} className="animate-spin text-text-muted" />
      case 'ready': return <Check size={13} className="text-success" />
      case 'error': return <X size={13} className="text-error" />
    }
  }

  const getTypeIcon = (type: UploadType) => {
    const icons = { photo: Camera, pdf: FileText, text: Type, link: LinkIcon }
    const Icon = icons[type]
    return <Icon size={13} strokeWidth={1.5} />
  }

  const formatTime = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'photo')} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'pdf')} />

      <div className="relative z-10">
        <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1 tracking-tight">Upload Hub</h1>
        <p className="text-[13px] text-text-muted mb-5">Drop in your homework and start learning.</p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-5 border-2 border-dashed rounded-[var(--radius-xl)] text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-text-muted bg-pastel-blue/30'
              : 'border-border/80 hover:border-text-muted/40 hover:bg-accent-light/30'
          }`}
        >
          <div className="py-8">
            <Upload className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-text-primary' : 'text-text-muted'}`} size={22} strokeWidth={1.5} />
            <p className="text-[13px] text-text-secondary font-medium mb-0.5">
              {isDragging ? 'Drop here' : 'Drag & drop files'}
            </p>
            <p className="text-[11px] text-text-muted">or choose below</p>
          </div>
        </div>

        {/* Method cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {methodConfig.map(({ icon: Icon, label, description, pastel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-sm transition-all h-full"
                padding="sm"
                pastel={pastel + '50'}
                onClick={() => {
                  if (label === 'Take Photo') photoInputRef.current?.click()
                  else if (label === 'Upload PDF') fileInputRef.current?.click()
                  else if (label === 'Paste Text') setActiveModal('text')
                  else setActiveModal('link')
                }}
              >
                <div className="w-7 h-7 rounded-[var(--radius-sm)] mb-2 flex items-center justify-center" style={{ backgroundColor: pastel }}>
                  <Icon size={14} className="text-text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-text-primary text-[13px] mb-0.5">{label}</h3>
                <p className="text-[10px] text-text-muted">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent uploads */}
        <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-2.5">Recent Uploads</h2>
        {uploads.length === 0 ? (
          <div className="text-center py-6 text-[12px] text-text-muted border border-border/60 dark:border-dark-border rounded-[var(--radius-lg)]">
            No uploads yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-3 py-2.5 border border-border/60 dark:border-dark-border rounded-[var(--radius-md)] group hover:bg-accent-light/30 transition-all"
              >
                <span className="text-text-muted">{getTypeIcon(upload.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary truncate">{upload.name}</p>
                  <p className="text-[10px] text-text-muted">
                    {formatTime(upload.createdAt)}
                    {upload.status === 'ready' && upload.topics && ` · ${upload.topics.length} topic${upload.topics.length !== 1 ? 's' : ''}`}
                    {upload.status === 'processing' && ' · Analysing...'}
                  </p>
                </div>
                {getStatusIcon(upload.status)}
                <button onClick={() => removeUpload(upload.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all p-0.5">
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'text' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 px-6" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ y: 10 }} animate={{ y: 0 }} exit={{ y: 10 }} className="bg-white dark:bg-dark-surface border border-border rounded-[var(--radius-xl)] p-5 w-full max-w-md shadow-lg shadow-black/5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-text-primary">Paste Text</h3>
                <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
              </div>
              <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste or type homework content..." autoFocus
                className="w-full h-36 px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-bg text-text-primary placeholder:text-text-muted text-[13px] focus:outline-none focus:border-text-muted transition-colors resize-none mb-4" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim()}>Add Content</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {activeModal === 'link' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 px-6" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ y: 10 }} animate={{ y: 0 }} exit={{ y: 10 }} className="bg-white dark:bg-dark-surface border border-border rounded-[var(--radius-xl)] p-5 w-full max-w-md shadow-lg shadow-black/5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-text-primary">Add Link</h3>
                <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
              </div>
              <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://example.com/article" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-bg text-text-primary placeholder:text-text-muted text-[13px] focus:outline-none focus:border-text-muted transition-colors mb-4" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button size="sm" onClick={handleLinkSubmit} disabled={!linkInput.trim()}>Import</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
