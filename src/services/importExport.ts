// Import/Export all user data from localStorage

const STORE_KEYS = [
  'orbit-user',
  'orbit-settings',
  'orbit-theme',
  'orbit-uploads',
  'orbit-session',
  'orbit-subjects',
  'orbit-data',
  'orbit-subscription',
  'orbit-analytics',
  'orbit-homework',
  'orbit-curriculum',
  'orbit-shop',
  'orbit-friends',
  'orbit-confidence',
  'orbit-error-patterns',
  'orbit-learning-style',
  'orbit-notif-prefs',
  'orbit-break-prefs',
]

export function exportAllData(): string {
  const data: Record<string, unknown> = {}
  for (const key of STORE_KEYS) {
    const val = localStorage.getItem(key)
    if (val) {
      try {
        data[key] = JSON.parse(val)
      } catch {
        data[key] = val
      }
    }
  }
  data.__exportDate = new Date().toISOString()
  data.__version = '1.0'
  return JSON.stringify(data, null, 2)
}

export function downloadExport() {
  const json = exportAllData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orbit-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonString: string): { success: boolean; keysImported: number; error?: string } {
  try {
    const data = JSON.parse(jsonString)
    if (!data || typeof data !== 'object') {
      return { success: false, keysImported: 0, error: 'Invalid file format' }
    }

    let count = 0
    for (const key of STORE_KEYS) {
      if (data[key] !== undefined) {
        localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]))
        count++
      }
    }

    return { success: true, keysImported: count }
  } catch (err: any) {
    return { success: false, keysImported: 0, error: err.message || 'Failed to parse file' }
  }
}

export function clearAllData() {
  for (const key of STORE_KEYS) {
    localStorage.removeItem(key)
  }
}
