import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { keyboardShortcuts } from '@/keyboardShortcuts'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-6 rounded-sm border bg-muted px-1.5 py-1 text-center font-mono text-[11px] leading-none text-foreground shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg p-8 sm:max-w-xl sm:p-10">
        <div className="space-y-1 pr-8">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </div>

        <div className="space-y-2">
          {keyboardShortcuts.map((shortcut) => (
            <div
              key={`${shortcut.keys.join('-')}-${shortcut.action}`}
              className="flex min-h-10 w-fit max-w-full items-center gap-6 rounded-md px-1 py-1.5"
            >
              <ShortcutKeys keys={shortcut.keys} />
              <div className="min-w-0">
                <div className="text-sm text-foreground">{shortcut.action}</div>
                {shortcut.context && (
                  <div className="text-xs text-muted-foreground">{shortcut.context}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
