import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export interface AppSettings {
  rtl: boolean
  language: string
  userName: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  rtl: false,
  language: 'en',
  userName: 'Michael',
}

export function loadSettings(): AppSettings {
  try {
    const v = localStorage.getItem('mc:settings')
    return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem('mc:settings', JSON.stringify(s))
}

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  globalContext: Record<string, string>
  onGlobalChange: (data: Record<string, string>) => void
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

function ApiKeysSection() {
  const keys = useQuery(api.apiKeys.list) ?? []
  const createKey = useMutation(api.apiKeys.create)
  const removeKey = useMutation(api.apiKeys.remove)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    const result = await createKey({ name: newKeyName.trim() })
    setNewKeyValue(result.key)
    setNewKeyName('')
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">API Keys</h3>
      <p className="text-xs text-muted-foreground">Generate keys for agent access. Use as <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;key&gt;</code></p>

      {newKeyValue && (
        <div className="bg-muted p-2 rounded text-xs space-y-1">
          <div className="font-medium text-foreground">New key created — copy it now, it won't be shown again:</div>
          <code className="block bg-background p-1.5 rounded select-all break-all">{newKeyValue}</code>
          <Button size="sm" variant="ghost" onClick={() => setNewKeyValue(null)}>Dismiss</Button>
        </div>
      )}

      <div className="space-y-1">
        {keys.map(k => (
          <div key={k.id} className="flex items-center gap-2 text-xs py-1">
            <span className="font-medium text-foreground">{k.name}</span>
            <span className="text-muted-foreground">{k.keyPrefix}...</span>
            <span className="flex-1" />
            <button onClick={() => removeKey({ id: k.id as any })} className="text-muted-foreground hover:text-destructive transition-colors">delete</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Key name (e.g. claude-agent)"
          className="h-7 text-xs"
        />
        <Button size="sm" variant="outline" onClick={handleCreate}>Generate</Button>
      </div>
    </div>
  )
}

function SettingsForm({ globalContext, onGlobalChange, settings, onSettingsChange, onClose }: Omit<SettingsDialogProps, 'open'>) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [globalForm, setGlobalForm] = useState<Record<string, string>>({ ...globalContext })

  const handleSave = () => {
    onSettingsChange(localSettings)
    saveSettings(localSettings)
    onGlobalChange(globalForm)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Preferences</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Your Name</label>
            <Input
              value={localSettings.userName}
              onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Language</label>
            <select
              value={localSettings.language}
              onChange={(e) => {
                const lang = e.target.value
                setLocalSettings({ ...localSettings, language: lang, rtl: lang === 'he' || lang === 'ar' })
              }}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm text-foreground"
            >
              <option value="en">English</option>
              <option value="he">עברית (Hebrew)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rtl-toggle"
            checked={localSettings.rtl}
            onChange={(e) => setLocalSettings({ ...localSettings, rtl: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="rtl-toggle" className="text-xs text-muted-foreground">RTL layout (right-to-left)</label>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Global Context</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(globalForm).filter(([key]) => key !== 'notes').map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">{key}</label>
              <Input
                value={value}
                onChange={(e) => setGlobalForm({ ...globalForm, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        {globalForm.notes !== undefined && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Notes</label>
            <Textarea
              value={globalForm.notes}
              onChange={(e) => setGlobalForm({ ...globalForm, notes: e.target.value })}
              rows={2}
            />
          </div>
        )}
      </div>

      <ApiKeysSection />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}

export function SettingsDialog({ open, onClose, globalContext, onGlobalChange, settings, onSettingsChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        {open && (
          <SettingsForm
            globalContext={globalContext}
            onGlobalChange={onGlobalChange}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
