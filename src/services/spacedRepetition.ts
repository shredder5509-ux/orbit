export interface ReviewSchedule {
  topicId: string
  nextReviewDate: string // ISO date
  interval: number // days
  easeFactor: number // starts at 2.5
  reviewCount: number
}

// SM-2 algorithm (simplified)
// quality: 0-5 (0-2 = failed, 3 = hard, 4 = good, 5 = easy)
export function calculateNextReview(quality: number, current: ReviewSchedule): ReviewSchedule {
  let { interval, easeFactor, reviewCount } = current
  const q = Math.min(5, Math.max(0, quality))

  if (q < 3) {
    // Failed — reset interval
    interval = 1
    reviewCount = 0
  } else {
    if (reviewCount === 0) {
      interval = 1
    } else if (reviewCount === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
    reviewCount++
  }

  // Adjust ease factor
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    topicId: current.topicId,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    interval,
    easeFactor,
    reviewCount,
  }
}

export function createInitialSchedule(topicId: string): ReviewSchedule {
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 2) // First review in 2 days

  return {
    topicId,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    interval: 2,
    easeFactor: 2.5,
    reviewCount: 0,
  }
}

export function getTopicsDueForReview(schedules: ReviewSchedule[]): ReviewSchedule[] {
  const today = new Date().toISOString().split('T')[0]
  return schedules.filter((s) => s.nextReviewDate <= today)
}
