import { useRef, useSyncExternalStore, useCallback } from 'react'

type ShortcutMap = Record<string, () => void>

function isInputFocused() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable
}

function isModalOpen() {
  return document.querySelector('[data-slot="dialog-content"]') !== null
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const subscribe = useCallback((onStoreChange: () => void) => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return
      if (isModalOpen()) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const fn = shortcutsRef.current[e.key]
      if (fn) {
        e.preventDefault()
        fn()
        onStoreChange()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useSyncExternalStore(subscribe, () => null, () => null)
}
