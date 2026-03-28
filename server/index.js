import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required')
  process.exit(1)
}

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS'],
}))
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Proxy to Anthropic API with streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { model, max_tokens, system, messages, stream } = req.body

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, system, messages, stream }),
    })

    if (!response.ok) {
      const error = await response.text()
      res.status(response.status).send(error)
      return
    }

    // If streaming, pipe the response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            res.end()
            return
          }
          res.write(decoder.decode(value, { stream: true }))
        }
      }
      await pump()
    } else {
      // Non-streaming: return JSON
      const data = await response.json()
      res.json(data)
    }
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Orbit API running on port ${PORT}`)
})
