import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SettingsPageProps {
  globalContext: Record<string, string>
  onGlobalChange: (data: Record<string, string>) => void
  rtl: boolean
  onRtlChange: (v: boolean) => void
  onClose: () => void
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="min-w-0 mr-4">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card divide-y">
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-muted-foreground mb-2">{children}</h2>
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
    <>
      {newKeyValue && (
        <div className="bg-muted p-3 rounded-lg text-xs space-y-2 mb-3">
          <div className="font-medium text-foreground">
            New key created — copy it now, it won't be shown again:
          </div>
          <code className="block bg-background p-2 rounded select-all break-all">
            {newKeyValue}
          </code>
          <button onClick={() => setNewKeyValue(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}
      <SettingsCard>
        {keys.map((k) => (
          <SettingsRow key={k.id} label={k.name} description={`${k.keyPrefix}...`}>
            <button
              onClick={() => removeKey({ id: k.id as any })}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Revoke
            </button>
          </SettingsRow>
        ))}
        <div className="flex gap-2 p-3">
          <Input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Key name (e.g. claude-agent)"
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" onClick={handleCreate}>
            Generate
          </Button>
        </div>
      </SettingsCard>
    </>
  )
}

export function SettingsPage({ globalContext, onGlobalChange, rtl, onRtlChange, onClose }: SettingsPageProps) {
  const currentUser = useQuery(api.users.currentUser)
  const [globalForm, setGlobalForm] = useState<Record<string, string>>({ ...globalContext })
  const [saved, setSaved] = useState(false)

  const handleSaveGlobal = () => {
    onGlobalChange(globalForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Preferences</h1>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            Back to board
          </button>
        </div>

        {/* Account */}
        <div className="space-y-2">
          <SectionHeading>Account</SectionHeading>
          <SettingsCard>
            <SettingsRow label={currentUser?.name || 'User'} description={currentUser?.email || ''}>
              {currentUser?.image ? (
                <img src={currentUser.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </SettingsRow>
          </SettingsCard>
        </div>

        {/* Interface */}
        <div className="space-y-2">
          <SectionHeading>Interface</SectionHeading>
          <SettingsCard>
            <SettingsRow label="RTL layout" description="Use right-to-left text direction">
              <button
                onClick={() => onRtlChange(!rtl)}
                className={`w-9 h-5 rounded-full transition-colors relative ${rtl ? 'bg-primary' : 'bg-muted-foreground/20'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rtl ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </SettingsRow>
          </SettingsCard>
        </div>

        {/* Agent context */}
        <div className="space-y-2">
          <SectionHeading>Agent context</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Key-value pairs shared across all projects. Agents use this to find resources like vaults, skills folders, or API keys.
          </p>
          <SettingsCard>
            {Object.entries(globalForm).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center px-3 py-2">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newForm: Record<string, string> = {}
                    for (const [k, v] of Object.entries(globalForm)) {
                      newForm[k === key ? e.target.value : k] = v
                    }
                    setGlobalForm(newForm)
                  }}
                  className="h-8 text-xs w-32 shrink-0 font-medium border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:bg-muted/50 rounded"
                  placeholder="key"
                />
                <Input
                  value={value}
                  onChange={(e) => setGlobalForm({ ...globalForm, [key]: e.target.value })}
                  className="h-8 text-xs flex-1 border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:bg-muted/50 rounded"
                  placeholder="value"
                />
                <button
                  onClick={() => {
                    const newForm = { ...globalForm }
                    delete newForm[key]
                    setGlobalForm(newForm)
                  }}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors text-xs shrink-0 px-1"
                >
                  x
                </button>
              </div>
            ))}
            <div className="px-3 py-2 flex items-center justify-between">
              <button
                onClick={() => setGlobalForm({ ...globalForm, '': '' })}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + Add field
              </button>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-muted-foreground">Saved</span>}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSaveGlobal}>Save</Button>
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* API Keys */}
        <div className="space-y-2">
          <SectionHeading>API keys</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Authenticate agents via <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;key&gt;</code>
          </p>
          <ApiKeysSection />
        </div>
      </div>
    </div>
  )
}
