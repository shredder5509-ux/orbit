import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Link2, Trash2, Sparkles, Undo } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'

interface MapNode {
  id: string
  text: string
  x: number
  y: number
  color: string
  parentId: string | null
}

interface MapConnection {
  from: string
  to: string
}

const COLORS = ['#EBF3FF', '#E8FAF0', '#FFFAE8', '#FFECF0', '#F2ECFF', '#FFF3E8']

export function MindMapPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [nodes, setNodes] = useState<MapNode[]>([])
  const [connections, setConnections] = useState<MapConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [tool, setTool] = useState<'select' | 'add' | 'connect'>('select')
  const [aiTopic, setAiTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [undoStack, setUndoStack] = useState<{ nodes: MapNode[]; connections: MapConnection[] }[]>([])
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-20), { nodes: [...nodes], connections: [...connections] }])
  }, [nodes, connections])

  const undo = () => {
    const last = undoStack[undoStack.length - 1]
    if (last) {
      setNodes(last.nodes)
      setConnections(last.connections)
      setUndoStack((prev) => prev.slice(0, -1))
    }
  }

  const addNode = (x: number, y: number) => {
    pushUndo()
    const node: MapNode = {
      id: crypto.randomUUID(),
      text: 'New node',
      x,
      y,
      color: COLORS[nodes.length % COLORS.length],
      parentId: null,
    }
    setNodes((prev) => [...prev, node])
    setEditingNode(node.id)
    setEditText('New node')
    setTool('select')
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'add') {
      addNode(x, y)
      return
    }

    // Check if clicked on a node
    const clickedNode = nodes.find((n) =>
      Math.abs(n.x - x) < 60 && Math.abs(n.y - y) < 20
    )

    if (clickedNode) {
      if (tool === 'connect') {
        if (connectingFrom) {
          if (connectingFrom !== clickedNode.id) {
            pushUndo()
            setConnections((prev) => [...prev, { from: connectingFrom, to: clickedNode.id }])
          }
          setConnectingFrom(null)
          setTool('select')
        } else {
          setConnectingFrom(clickedNode.id)
        }
      } else {
        setSelectedNode(clickedNode.id)
      }
    } else {
      setSelectedNode(null)
      setConnectingFrom(null)
    }
  }

  const handleNodeDoubleClick = (id: string) => {
    const node = nodes.find((n) => n.id === id)
    if (node) {
      setEditingNode(id)
      setEditText(node.text)
    }
  }

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    if (tool !== 'select') return
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setSelectedNode(id)
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragOffset || !selectedNode) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, x, y } : n))
  }

  const handleMouseUp = () => {
    if (dragOffset) pushUndo()
    setDragOffset(null)
  }

  const saveEdit = () => {
    if (editingNode) {
      pushUndo()
      setNodes((prev) => prev.map((n) => n.id === editingNode ? { ...n, text: editText } : n))
      setEditingNode(null)
    }
  }

  const deleteSelected = () => {
    if (!selectedNode) return
    pushUndo()
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode))
    setConnections((prev) => prev.filter((c) => c.from !== selectedNode && c.to !== selectedNode))
    setSelectedNode(null)
  }

  const changeColor = (color: string) => {
    if (!selectedNode) return
    pushUndo()
    setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, color } : n))
  }

  const generateFromAI = async () => {
    if (!apiKey || !aiTopic.trim()) return
    setIsGenerating(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Create a concept map for the topic "${aiTopic}" for a 13-year-old student. Generate 8-15 nodes with connections.

Respond with ONLY JSON (no markdown):
{"nodes":[{"id":"1","text":"Main Topic","parentId":null},{"id":"2","text":"Subtopic","parentId":"1"},...]}

parentId connects child to parent. The first node should be the central topic with parentId null.`,
          }],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text || '{}')

      if (parsed.nodes) {
        const centerX = 400
        const centerY = 250
        const newNodes: MapNode[] = parsed.nodes.map((n: { id: string; text: string; parentId: string | null }, i: number) => {
          const angle = (i / parsed.nodes.length) * Math.PI * 2
          const radius = n.parentId === null ? 0 : 120 + Math.floor(i / 4) * 80
          return {
            id: n.id,
            text: n.text,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            color: COLORS[i % COLORS.length],
            parentId: n.parentId,
          }
        })

        const newConnections: MapConnection[] = parsed.nodes
          .filter((n: { parentId: string | null }) => n.parentId)
          .map((n: { id: string; parentId: string }) => ({
            from: n.parentId,
            to: n.id,
          }))

        pushUndo()
        setNodes(newNodes)
        setConnections(newConnections)
      }
    } catch {
      // silently fail
    } finally {
      setIsGenerating(false)
    }
  }

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#E5E5E5'
    ctx.lineWidth = 1

    connections.forEach((c) => {
      const from = nodes.find((n) => n.id === c.from)
      const to = nodes.find((n) => n.id === c.to)
      if (from && to) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }
    })
  }, [nodes, connections])

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Concept Map</h1>
      </div>

      {/* AI Generate */}
      <div className="flex gap-2 mb-3">
        <input
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="Enter a topic to generate..."
          className="flex-1 px-3 py-1.5 text-sm border-b border-border dark:border-dark-border bg-transparent text-text-primary dark:text-dark-text-primary focus:outline-none focus:border-text-muted"
        />
        <button
          onClick={generateFromAI}
          disabled={isGenerating || !apiKey || !aiTopic.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-text-secondary dark:text-dark-text-secondary disabled:opacity-40"
        >
          <Sparkles size={12} strokeWidth={1.5} />
          {isGenerating ? 'Generating...' : 'AI Generate'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setTool('add')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-[var(--radius-sm)] border ${
            tool === 'add' ? 'border-text-primary dark:border-dark-text-primary bg-text-primary/5' : 'border-border dark:border-dark-border'
          } text-text-secondary dark:text-dark-text-secondary`}
        >
          <Plus size={12} strokeWidth={1.5} /> Add
        </button>
        <button
          onClick={() => setTool('connect')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-[var(--radius-sm)] border ${
            tool === 'connect' ? 'border-text-primary dark:border-dark-text-primary bg-text-primary/5' : 'border-border dark:border-dark-border'
          } text-text-secondary dark:text-dark-text-secondary`}
        >
          <Link2 size={12} strokeWidth={1.5} /> Connect
        </button>
        {selectedNode && (
          <>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-error"
            >
              <Trash2 size={12} strokeWidth={1.5} /> Delete
            </button>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => changeColor(c)}
                className="w-5 h-5 rounded-full border border-border"
                style={{ backgroundColor: c }}
              />
            ))}
          </>
        )}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-text-muted disabled:opacity-30"
        >
          <Undo size={12} strokeWidth={1.5} />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full border border-border dark:border-dark-border rounded-[var(--radius-lg)] bg-white dark:bg-dark-surface overflow-hidden"
        style={{ height: 500, cursor: tool === 'add' ? 'crosshair' : tool === 'connect' ? 'pointer' : 'default' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onDoubleClick={() => handleNodeDoubleClick(node.id)}
            onClick={(e) => e.stopPropagation()}
            className={`absolute px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-text-primary dark:text-dark-text-primary select-none cursor-grab active:cursor-grabbing ${
              selectedNode === node.id ? 'ring-1 ring-text-primary dark:ring-dark-text-primary' : ''
            }`}
            style={{
              left: node.x - 50,
              top: node.y - 14,
              backgroundColor: node.color,
              minWidth: 100,
              textAlign: 'center',
            }}
          >
            {editingNode === node.id ? (
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }}
                className="w-full bg-transparent text-center text-xs focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              node.text
            )}
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-text-muted">Click "Add" then click here to add nodes, or use AI Generate</p>
          </div>
        )}
      </div>

      {connectingFrom && (
        <p className="text-xs text-text-muted mt-2 text-center">Click another node to connect</p>
      )}
    </div>
  )
}
