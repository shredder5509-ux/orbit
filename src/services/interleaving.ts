import type { Subject } from '../stores/subjectStore'

export interface InterleavedQuestion {
  question: string
  options: string[]
  correctIndex: number
  subject: string
  topic: string
}

/**
 * Generate a mixed-topic question set from different subjects/topics.
 * Weights toward in-progress and needs-review topics.
 * Never places the same topic back-to-back.
 */
export function selectInterleavedTopics(
  subjects: Subject[],
  count: number = 15
): { subject: string; topic: string }[] {
  const candidates: { subject: string; topic: string; weight: number }[] = []

  for (const subject of subjects) {
    for (const topic of subject.topics) {
      let weight = 1
      if (topic.status === 'in_progress') weight = 3
      else if (topic.status === 'needs_review') weight = 4
      else if (topic.status === 'mastered') weight = 1
      else weight = 0.5 // untouched

      candidates.push({ subject: subject.name, topic: topic.name, weight })
    }
  }

  if (candidates.length === 0) return []

  // Weighted random selection, no same topic back-to-back
  const selected: { subject: string; topic: string }[] = []
  let lastTopic = ''

  for (let i = 0; i < count && candidates.length > 0; i++) {
    const available = candidates.filter((c) => c.topic !== lastTopic)
    if (available.length === 0) break

    const totalWeight = available.reduce((sum, c) => sum + c.weight, 0)
    let r = Math.random() * totalWeight
    let picked = available[0]

    for (const c of available) {
      r -= c.weight
      if (r <= 0) { picked = c; break }
    }

    selected.push({ subject: picked.subject, topic: picked.topic })
    lastTopic = picked.topic
  }

  return selected
}

export function buildInterleavingPrompt(
  topics: { subject: string; topic: string }[]
): string {
  const topicList = topics.map((t, i) => `${i + 1}. ${t.subject} — ${t.topic}`).join('\n')

  return `Generate ${topics.length} mixed-topic quiz questions for interleaved practice. Each question should be from a DIFFERENT topic, following this order:

${topicList}

Target audience: 13-year-old students. Questions should test understanding, not just recall.

Respond with ONLY a JSON array (no markdown):
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"subject":"...","topic":"..."},...]

Each question must have exactly 4 options. correctIndex is 0-3. NEVER place two questions from the same topic back-to-back.`
}
