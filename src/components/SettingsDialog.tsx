import { useState } from 'react'
import type { AppData, GlobalContext } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  data: AppData
  onChange: (data: AppData) => void
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

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

function SettingsForm({ data, onChange, settings, onSettingsChange, onClose }: Omit<SettingsDialogProps, 'open'>) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [globalForm, setGlobalForm] = useState<GlobalContext>({ ...data.global })

  const handleSave = () => {
    onSettingsChange(localSettings)
    saveSettings(localSettings)
    onChange({ ...data, global: globalForm })
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
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Notes</label>
          <Textarea
            value={globalForm.notes}
            onChange={(e) => setGlobalForm({ ...globalForm, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}

export function SettingsDialog({ open, onClose, data, onChange, settings, onSettingsChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        {open && (
          <SettingsForm
            data={data}
            onChange={onChange}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
