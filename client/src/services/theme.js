export const THEMES = [
  {
    id: 'dark',
    name: 'Dark Cyber',
    badge: 'Default',
    desc: 'Classic obsidian dark mode with indigo & cyan glow',
    previewColors: ['#0a0d14', '#111827', '#6366f1', '#06b6d4'],
  },
  {
    id: 'purple',
    name: 'Midnight Purple',
    badge: 'Vibrant',
    desc: 'Mystic deep violet theme with amethyst & magenta accents',
    previewColors: ['#0f0919', '#170e28', '#a855f7', '#ec4899'],
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    badge: 'Fresh',
    desc: 'Deep abyssal navy theme with emerald teal & cyan accents',
    previewColors: ['#08131e', '#0e1e2e', '#14b8a6', '#38bdf8'],
  },
  {
    id: 'ember',
    name: 'Sunset Ember',
    badge: 'Warm',
    desc: 'Volcanic slate theme with rose & amber accents',
    previewColors: ['#120d0e', '#1c1316', '#f43f5e', '#f59e0b'],
  },
  {
    id: 'light',
    name: 'Nordic Light',
    badge: 'Light',
    desc: 'Clean minimal light mode with slate & indigo accents',
    previewColors: ['#f8fafc', '#ffffff', '#4f46e5', '#0284c7'],
  },
]

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem('app_theme') || 'dark'
}

export function applyTheme(themeId) {
  if (typeof window === 'undefined') return
  const validTheme = THEMES.some(t => t.id === themeId) ? themeId : 'dark'
  document.documentElement.setAttribute('data-theme', validTheme)
  localStorage.setItem('app_theme', validTheme)
  window.dispatchEvent(new CustomEvent('themeChange', { detail: validTheme }))
}

export function initTheme() {
  const current = getStoredTheme()
  applyTheme(current)
}
