import type { SessionPhase, SessionMode } from '../stores/sessionStore'
import type { Curriculum } from '../stores/userStore'
import type { Subject, Topic } from '../stores/subjectStore'
import { getSubjectColour } from '../stores/subjectStore'

const DIRECT_API_URL = 'https://api.anthropic.com/v1/messages'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const API_URL = BACKEND_URL ? `${BACKEND_URL}/api/chat` : DIRECT_API_URL
const USE_PROXY = !!BACKEND_URL
const MODEL = 'claude-sonnet-4-20250514'

function getHeaders(apiKey: string): Record<string, string> {
  if (USE_PROXY) {
    return { 'content-type': 'application/json' }
  }
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
}

interface MessageParam {
  role: 'user' | 'assistant'
  content: string
}

export function buildSystemPrompt(
  tutorName: string,
  displayName: string,
  uploadContent: string,
  phase: SessionPhase,
  sessionMode: SessionMode = 'homework',
  masteredTopics: string[] = []
): string {
  const truncated = uploadContent.length > 8000
    ? uploadContent.slice(0, 8000) + '\n\n[Content truncated for length]'
    : uploadContent

  const phaseInstructions: Record<string, string> = {
    // Homework phases
    hook: `You are in the HOOK phase. Your goal:
- Connect this topic to something real and relatable for a 13-year-old
- Make them curious about why this matters
- Ask ONE intriguing opening question to gauge what they already know
- Keep it to 1-2 short messages. When you've hooked them, end your message with [PHASE_COMPLETE]`,

    discover: `You are in the DISCOVER phase. Your goal:
- Break the content into key concepts and teach them one at a time
- Use the Socratic method: ASK before TELL. Guide them to discover answers.
- At each step ask "What do you think...?" or "Can you see a pattern?"
- If they're right: affirm and go deeper
- If they're partially right: build on what's correct
- If they're stuck: give a hint, then a simpler question
- After 4-8 meaningful exchanges where the core concepts have been covered, end your message with [PHASE_COMPLETE]
- Never give answers directly — guide them to find it`,

    consolidate: `You are in the CONSOLIDATE phase. Your goal:
- Briefly summarise what was just learned
- Ask the student to explain the concept back in their own words
- Gently correct any misconceptions
- After 2-3 exchanges, end your message with [PHASE_COMPLETE]`,

    check: `You are in the CHECK phase. Your goal:
- Ask 2-3 quick comprehension questions that test UNDERSTANDING, not memorisation
- Questions should apply the concept to a new situation
- Give brief feedback on each answer
- After all questions are answered, end your message with [PHASE_COMPLETE]`,

    bridge: `You are in the BRIDGE phase. Your goal:
- Connect what was learned to the bigger picture
- Mention what topics this leads to next
- End with encouragement: celebrate their effort
- This is the final teaching phase. End your message with [PHASE_COMPLETE]`,

    // Test revision phases
    overview: `You are in the OVERVIEW phase for TEST REVISION. Your goal:
- Give a concise, clear summary of ALL the key concepts the student needs to know
- Organise them into bullet points or numbered list
- Highlight the most important things to remember
- Keep it focused and exam-ready — no fluff
- After the overview, end your message with [PHASE_COMPLETE]`,

    flashcards: `You are in the FLASHCARDS phase for TEST REVISION. Your goal:
- Ask rapid-fire question-and-answer pairs to test recall
- One question per message. Keep them short and punchy.
- Give immediate feedback: ✅ if correct, then the right answer if not
- Cover the key concepts from the overview
- After 5-8 flashcard exchanges, end your message with [PHASE_COMPLETE]`,

    practice: `You are in the PRACTICE phase for TEST REVISION. Your goal:
- Give 2-3 exam-style questions that are harder than the flashcards
- These should require applying knowledge, not just recalling facts
- Give detailed feedback on each answer
- After all practice questions are done, end your message with [PHASE_COMPLETE]`,

    // Project phases
    brief: `You are in the BRIEF phase for a PROJECT session. Your goal:
- Analyse the project brief / assignment from the uploaded content
- Break it down clearly: what is the student being asked to do?
- List the key requirements and success criteria
- Ask if the student has any questions about the brief
- After clarifying the brief, end your message with [PHASE_COMPLETE]`,

    planning: `You are in the PLANNING phase for a PROJECT session. Your goal:
- Help the student plan their approach to the project
- Suggest a structure or outline they could follow
- Break it into manageable steps or milestones
- Ask the student what approach they want to take
- After the plan is agreed, end your message with [PHASE_COMPLETE]`,

    guidance: `You are in the GUIDANCE phase for a PROJECT session. Your goal:
- Act as a mentor while the student works on their project
- Answer questions, offer tips, and suggest improvements
- Don't do the work for them — guide and encourage
- If they seem ready to submit, suggest they do so
- After 3-6 helpful exchanges, end your message with [PHASE_COMPLETE]`,
  }

  const modeContext: Record<SessionMode, string> = {
    homework: 'This is a HOMEWORK study session. Teach the content step by step using the Socratic method.',
    test: 'This is a TEST REVISION session. Help the student prepare for an exam with focused, efficient review.',
    project: 'This is a PROJECT session. Guide the student through understanding and completing a project or assignment.',
  }

  return `You are ${tutorName}, a study companion for ${displayName} using the Orbit study app. Your personality is that of a smart older sibling — casual, encouraging, and a bit playful. Never condescending, never stiff.

SESSION TYPE: ${sessionMode.toUpperCase()}
${modeContext[sessionMode]}

VOICE RULES:
- Say "we" and "let's", not "you should"
- Celebrate effort: "Nice thinking!" / "Ooh, interesting take"
- For wrong answers: "Hmm, not quite — but I can see why you'd think that. What if..."
- Never say "Wrong" or "Incorrect"
- Keep messages SHORT. Max 3-4 sentences for teaching. 1-2 sentences for reactions.
- Use line breaks between thoughts
- Occasional emoji is fine (💡 🎯) but don't overdo it

CONTENT:
"""
${truncated}
"""

CURRENT PHASE: ${phase.toUpperCase()}
${phaseInstructions[phase] || ''}
${masteredTopics.length > 0 ? `
CONCEPT CONNECTIONS — The student has already mastered these topics: ${masteredTopics.join(', ')}.
When relevant, reference these to build connections: "Remember when we learned about [topic]? This is similar because..." This helps the student see how knowledge connects. Only reference topics that are genuinely related — don't force connections.` : ''}

CRITICAL: If the student asks you to just give them the answer, solve their homework, or write their essay, REFUSE cheerfully. Say something like: "Nah, that's no fun — but I'll help you figure it out yourself!" Never do the student's work for them. Guide, don't give.

IMPORTANT: When the current phase is complete, append [PHASE_COMPLETE] at the very end of your message. Do NOT say this marker out loud — it's a hidden signal. Just naturally end your message and append it.`
}

export function buildGradingPrompt(
  tutorName: string,
  uploadContent: string,
  submission: string
): string {
  const truncated = uploadContent.length > 6000
    ? uploadContent.slice(0, 6000) + '\n\n[Content truncated]'
    : uploadContent

  return `You are ${tutorName}, grading a student's written submission. Be encouraging but honest.

ORIGINAL MATERIAL:
"""
${truncated}
"""

STUDENT'S SUBMISSION:
"""
${submission}
"""

Evaluate the submission and respond with ONLY a JSON object (no markdown, no code fences):
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentences of overall feedback, encouraging tone>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Scoring guide:
- 90-100: Excellent understanding, clear explanation, good examples
- 70-89: Good understanding with minor gaps
- 50-69: Basic understanding but missing key concepts
- 30-49: Partial understanding with significant gaps
- 0-29: Major misunderstanding or very minimal effort`
}

export async function streamMessage(
  apiKey: string,
  systemPrompt: string,
  messages: MessageParam[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void
): Promise<void> {
  let accumulated = ''

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      let msg = `API error ${response.status}`
      try {
        const parsed = JSON.parse(errorBody)
        msg = parsed.error?.message || msg
      } catch {}
      onError(msg)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('No response stream')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const event = JSON.parse(data)
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            event.delta?.text
          ) {
            accumulated += event.delta.text
            onChunk(event.delta.text)
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    onDone(accumulated)
  } catch (err: any) {
    onError(err.message || 'Network error')
  }
}

export async function gradeSubmission(
  apiKey: string,
  uploadContent: string,
  submission: string,
  tutorName: string
): Promise<{
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}> {
  const systemPrompt = buildGradingPrompt(tutorName, uploadContent, submission)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Please grade my submission.' }],
    }),
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text || ''

  try {
    // Try to extract JSON from the response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {}

  // Fallback
  return {
    score: 50,
    feedback: text || 'Unable to parse grade. Please try again.',
    strengths: ['Submitted work for review'],
    improvements: ['Try adding more detail to your explanation'],
  }
}

export async function generateSubjectTopics(
  apiKey: string,
  curriculum: Curriculum,
  age: number,
  subjectNames: string[]
): Promise<Subject[]> {
  const systemPrompt = `You are a curriculum expert. Generate a study topic tree for a ${age}-year-old student studying the ${curriculum.toUpperCase()} curriculum.

For each subject provided, generate 5-8 key revision topics appropriate for this age and curriculum level.

Respond with ONLY a JSON array (no markdown, no code fences):
[
  {
    "name": "Subject Name",
    "topics": [
      {
        "name": "Topic Name",
        "description": "One sentence describing what this covers",
        "difficulty": 1-5,
        "estimatedMinutes": 10-30
      }
    ]
  }
]

Order topics from foundational to advanced within each subject.`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate revision topics for these subjects: ${subjectNames.join(', ')}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text || ''

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.map((subject: any, idx: number) => ({
        id: crypto.randomUUID(),
        name: subject.name,
        colour: getSubjectColour(idx),
        expanded: idx === 0,
        topics: (subject.topics || []).map((topic: any) => ({
          id: crypto.randomUUID(),
          name: topic.name,
          description: topic.description || '',
          difficulty: topic.difficulty || 3,
          estimatedMinutes: topic.estimatedMinutes || 15,
          status: 'untouched' as const,
        })),
      }))
    }
  } catch {}

  // Fallback: create basic subjects without topics
  return subjectNames.map((name, idx) => ({
    id: crypto.randomUUID(),
    name,
    colour: getSubjectColour(idx),
    expanded: false,
    topics: [],
  }))
}

export async function extractTimetableFromPhoto(
  apiKey: string,
  imageBase64: string
): Promise<Record<string, string[]>> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: `Extract the school timetable from this image. Return ONLY a JSON object (no markdown, no code fences) mapping days to arrays of subject names for each period:
{"Mon": ["Maths", "English", "Science", "", "", ""], "Tue": [...], "Wed": [...], "Thu": [...], "Fri": [...]}
Each day should have exactly 6 entries (periods 1-6). Use empty string "" for free periods or lunch.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: 'text',
              text: 'Please extract the timetable from this image.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text || ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Could not extract timetable from image')
}

// Practice exam types
export interface ExamQuestion {
  id: string
  text: string
  marks: number
  type: 'short' | 'extended' | 'calculation'
  modelAnswer: string
}

export interface PracticeExam {
  title: string
  subject: string
  totalMarks: number
  duration: number
  questions: ExamQuestion[]
}

export interface ExamResult {
  questionId: string
  score: number
  maxMarks: number
  feedback: string
}

export async function generatePracticeExam(
  apiKey: string,
  subject: string,
  topics: string[],
  difficulty: 'foundation' | 'higher' | 'mixed',
  duration: number,
  curriculum: string
): Promise<PracticeExam> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `Generate a realistic practice exam for a 13-year-old student.
Return ONLY a JSON object (no markdown, no code fences) with this structure:
{
  "title": "exam title",
  "subject": "${subject}",
  "totalMarks": number,
  "duration": ${duration},
  "questions": [
    {
      "id": "q1",
      "text": "question text",
      "marks": number,
      "type": "short" | "extended" | "calculation",
      "modelAnswer": "the correct answer with working"
    }
  ]
}
Include 6-10 questions. Mix short answer (2-4 marks), extended response (6-8 marks), and calculation questions if maths/science.
Difficulty: ${difficulty}. Curriculum: ${curriculum}. Topics: ${topics.join(', ')}.
Target duration: ${duration} minutes. Total marks should be appropriate for the duration.`,
      messages: [{ role: 'user', content: `Generate a ${duration}-minute ${difficulty} ${subject} practice exam covering: ${topics.join(', ')}` }],
    }),
  })

  if (!response.ok) throw new Error(`Hmm, couldn't generate the exam. Try again?`)

  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      ...parsed,
      questions: parsed.questions.map((q: any, i: number) => ({ ...q, id: q.id || `q${i + 1}` })),
    }
  }
  throw new Error('Could not generate exam')
}

export async function gradePracticeExam(
  apiKey: string,
  exam: PracticeExam,
  answers: Record<string, string>,
  tutorName: string
): Promise<{ results: ExamResult[]; totalScore: number; totalMarks: number; summary: string }> {
  const questionsWithAnswers = exam.questions.map((q) => ({
    id: q.id,
    question: q.text,
    marks: q.marks,
    modelAnswer: q.modelAnswer,
    studentAnswer: answers[q.id] || '(no answer)',
  }))

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `You are ${tutorName}, marking a student's practice exam. Be encouraging but honest.
Return ONLY JSON (no markdown):
{
  "results": [{ "questionId": "q1", "score": number, "maxMarks": number, "feedback": "brief feedback" }],
  "totalScore": number,
  "totalMarks": number,
  "summary": "2-3 sentences about overall performance, strengths, and what to improve"
}`,
      messages: [{ role: 'user', content: JSON.stringify(questionsWithAnswers) }],
    }),
  })

  if (!response.ok) throw new Error(`Couldn't mark the exam. Try again?`)

  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not grade exam')
}

// ─── TEACH ME IN 5 MINUTES ───

export interface CrashCourse {
  what_it_is: string
  why_it_matters: string
  key_points: string[]
  example: string
  common_mistake: string
  memory_trick: string
  exam_tip: string
}

export async function teachInFiveMinutes(
  apiKey: string,
  topic: string,
  age: number,
  curriculum?: string
): Promise<CrashCourse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: `A student needs to understand "${topic}" in under 5 minutes. Give a FAST, CLEAR explanation. No questions, just teach. Use simple language for a ${age}-year-old${curriculum ? ` studying ${curriculum}` : ''}.
Return ONLY JSON:
{
  "what_it_is": "one sentence definition",
  "why_it_matters": "one sentence on importance",
  "key_points": ["3-5 bullet points, 2 sentences max each"],
  "example": "one clear worked example",
  "common_mistake": "one thing students get wrong",
  "memory_trick": "a mnemonic or memory aid",
  "exam_tip": "one exam answering tip"
}
Total under 300 words.`,
      messages: [{ role: 'user', content: `Teach me: ${topic}` }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t generate the crash course. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse crash course')
}

// ─── ESSAY MARKER ───

export interface EssayFeedback {
  overall_grade: string
  overall_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  paragraph_feedback: { paragraph_number: number; first_words: string; score: 'strong' | 'adequate' | 'needs_work'; feedback: string; suggestion?: string }[]
  marking_criteria: { name: string; score: number; max: number }[]
  spelling_grammar: string[]
}

export async function markEssay(
  apiKey: string,
  essay: string,
  subject: string,
  title: string,
  wordLimit?: number
): Promise<EssayFeedback> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an experienced ${subject} teacher marking a 13-year-old's essay.
Title: "${title}". Word limit: ${wordLimit || 'none'}.
Be ENCOURAGING but HONEST. Use specific examples from their writing.
Return ONLY JSON:
{
  "overall_grade": "Grade 1-9 or A-E",
  "overall_score": 0-100,
  "summary": "2-3 sentence assessment",
  "strengths": ["3-5 specific strengths with quotes"],
  "improvements": ["3-5 areas to improve with suggestions"],
  "paragraph_feedback": [{"paragraph_number": 1, "first_words": "first 5 words", "score": "strong|adequate|needs_work", "feedback": "1-2 sentences", "suggestion": "rewrite suggestion if needed"}],
  "marking_criteria": [{"name": "Content & ideas", "score": 7, "max": 10}, {"name": "Structure", "score": 6, "max": 10}, {"name": "Language", "score": 8, "max": 10}, {"name": "SPaG", "score": 7, "max": 10}],
  "spelling_grammar": ["specific errors, max 10"]
}`,
      messages: [{ role: 'user', content: essay }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t mark the essay. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse essay feedback')
}

// ─── MATH SOLVER ───

export interface MathSolution {
  problem_text: string
  problem_type: string
  steps: { explanation: string; working: string; why: string }[]
  final_answer: string
  check: string
  tip: string
}

export async function solveMathProblem(
  apiKey: string,
  problem: string,
  imageBase64?: string
): Promise<MathSolution> {
  const messages: any[] = imageBase64
    ? [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } },
        { type: 'text', text: 'Solve this maths problem step by step.' },
      ]}]
    : [{ role: 'user', content: `Solve step by step: ${problem}` }]

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1536,
      system: `A 13-year-old needs help solving a maths problem. Show step-by-step working. Do NOT just give the answer.
Return ONLY JSON:
{
  "problem_text": "the problem as text",
  "problem_type": "linear equation / quadratic / etc",
  "steps": [{"explanation": "what you're doing", "working": "the mathematical working", "why": "why this step works"}],
  "final_answer": "x = 3",
  "check": "substitution check",
  "tip": "one helpful tip"
}`,
      messages,
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t solve the problem. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse solution')
}

// ─── NOTES SCANNER ───

export interface OrganizedNotes {
  subject: string
  topic: string
  summary: string
  content: string
  keyTerms: string[]
  flaggedParts: string[]
}

export async function scanAndOrganizeNotes(
  apiKey: string,
  imageBase64: string,
  subject?: string
): Promise<OrganizedNotes> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `Read handwritten class notes from a photo. Transcribe, clean up, and organize into structured notes.
Add clear headings. Bold key terms. Format equations. Convert messy lists to bullets. Flag illegible parts.
${subject ? `Subject: ${subject}` : ''}
Return ONLY JSON:
{"subject": "", "topic": "", "summary": "2-3 sentences", "content": "markdown formatted notes", "keyTerms": ["term1"], "flaggedParts": ["parts you couldn't read"]}`,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 },
        }, { type: 'text', text: 'Transcribe and organize these class notes.' }],
      }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t read the notes. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse notes')
}

// ─── CITATION GENERATOR ───

export interface Citation {
  formatted: string
  inText: string
  notes: string
}

export async function generateCitation(
  apiKey: string,
  sourceType: string,
  input: string,
  author?: string,
  date?: string,
  format: string = 'harvard'
): Promise<Citation> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: `Generate a properly formatted ${format} citation.
Type: ${sourceType}. Author: ${author || 'unknown'}. Date: ${date || 'unknown'}.
Return ONLY JSON: {"formatted": "full citation", "inText": "in-text citation", "notes": "any notes about missing info"}`,
      messages: [{ role: 'user', content: input }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t generate citation. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse citation')
}

// ─── CURRICULUM SPEC GENERATOR ───

export interface SpecPoint {
  id: string
  code: string
  title: string
  description: string
  covered: boolean
  mastered: boolean
}

export interface SpecUnit {
  id: string
  code: string
  title: string
  points: SpecPoint[]
}

export interface CurriculumSpec {
  examBoard: string
  subject: string
  level: string
  units: SpecUnit[]
}

export async function generateCurriculumSpec(
  apiKey: string,
  examBoard: string,
  subject: string,
  level: string
): Promise<CurriculumSpec> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `Generate the specification outline for ${examBoard} ${level} ${subject}. Break into units and spec points as they appear in the real spec. Be accurate.
Return ONLY JSON:
{"examBoard": "", "subject": "", "level": "", "units": [{"id": "u1", "code": "4.1", "title": "", "points": [{"id": "p1", "code": "4.1.1", "title": "", "description": "", "covered": false, "mastered": false}]}]}`,
      messages: [{ role: 'user', content: `Generate full spec: ${examBoard} ${level} ${subject}` }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t generate curriculum. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse curriculum')
}

// ─── WORKSHEET GENERATOR ───

export interface WorksheetQuestion {
  id: string
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'matching' | 'true_false'
  question: string
  options?: string[]
  answer: string
  explanation: string
  marks: number
}

export interface Worksheet {
  title: string
  subject: string
  topic: string
  difficulty: string
  questions: WorksheetQuestion[]
  totalMarks: number
}

export async function generateWorksheet(
  apiKey: string,
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  questionCount: number,
  questionTypes: string[]
): Promise<Worksheet> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `Generate a worksheet for a 13-year-old student. Subject: ${subject}. Topic: ${topic}. Difficulty: ${difficulty}.
Include ${questionCount} questions. Types to use: ${questionTypes.join(', ')}.
Return ONLY JSON:
{
  "title": "worksheet title",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "totalMarks": number,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|fill_blank|short_answer|matching|true_false",
      "question": "the question text",
      "options": ["A", "B", "C", "D"] (only for multiple_choice),
      "answer": "correct answer",
      "explanation": "why this is correct",
      "marks": number
    }
  ]
}`,
      messages: [{ role: 'user', content: `Generate a ${difficulty} ${subject} worksheet on ${topic}` }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t generate worksheet. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse worksheet')
}

// ─── READING COMPREHENSION ───

export interface ComprehensionPassage {
  title: string
  text: string
  source: string
  wordCount: number
  questions: { id: string; question: string; type: 'inference' | 'retrieval' | 'vocabulary' | 'summary' | 'evaluation'; marks: number; modelAnswer: string }[]
  vocabulary: { word: string; definition: string }[]
}

export async function generateComprehension(
  apiKey: string,
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  genre: string
): Promise<ComprehensionPassage> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: `Generate a reading comprehension exercise for a 13-year-old. Genre: ${genre}. Difficulty: ${difficulty}.
Create an engaging passage (200-400 words) with 5-7 comprehension questions testing different skills.
Return ONLY JSON:
{
  "title": "passage title",
  "text": "the full passage text",
  "source": "fictional source attribution",
  "wordCount": number,
  "questions": [
    {"id": "q1", "question": "question text", "type": "inference|retrieval|vocabulary|summary|evaluation", "marks": number, "modelAnswer": "expected answer"}
  ],
  "vocabulary": [{"word": "challenging word from text", "definition": "simple definition"}]
}`,
      messages: [{ role: 'user', content: `Generate a ${difficulty} ${genre} reading comprehension for ${subject}` }],
    }),
  })
  if (!response.ok) throw new Error('Couldn\'t generate passage. Try again?')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('Could not parse comprehension')
}
