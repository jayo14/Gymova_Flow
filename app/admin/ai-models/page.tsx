import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Save, Power, PowerOff } from "lucide-react"
import { listAiModelConfigs, saveAiModelConfig, toggleAiModel } from "../actions"

const PROVIDER_ORDER = ["openai", "anthropic", "google", "xai", "deepseek"]

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Not updated yet"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function AIModelsPage() {
  const configs = await listAiModelConfigs()

  async function submitSave(formData: FormData) {
    "use server"
    await saveAiModelConfig(formData)
  }

  async function submitToggle(formData: FormData) {
    "use server"
    await toggleAiModel(formData)
  }

  const activeProvider = PROVIDER_ORDER.find((provider) => configs.find((config) => config.provider === provider && config.is_enabled && config.api_key))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Models</h1>
        <p className="text-muted-foreground mt-1">
          Manage the API keys and model selection that power the AI Coach. The first enabled provider in priority order becomes active.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current active provider</p>
            <p className="text-2xl font-semibold text-foreground">
              {configs.find((config) => config.provider === activeProvider)?.display_name ?? "No enabled provider"}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">Priority order: ChatGPT, Claude, Gemini, Grok, DeepSeek</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.provider} className="bg-card border-border">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-foreground">{config.display_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Last updated {formatUpdatedAt(config.updated_at)}</p>
              </div>
              <div className="flex gap-2">
                {config.provider === activeProvider && config.is_enabled && config.api_key && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Active</Badge>
                )}
                <Badge variant="secondary" className={config.is_enabled ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-muted text-muted-foreground border-0"}>
                  {config.is_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={submitSave} id={`save-${config.provider}`} className="space-y-4">
                <input type="hidden" name="provider" value={config.provider} />
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Model name</label>
                  <Input name="model_name" defaultValue={config.model_name} placeholder={config.default_model} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">API key</label>
                  <Input name="api_key" defaultValue={config.api_key} placeholder="Paste API key" className="bg-background border-border" />
                </div>
              </form>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="submit" 
                  form={`save-${config.provider}`}
                  size="icon" 
                  title="Save credentials" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <form action={submitToggle}>
                  <input type="hidden" name="provider" value={config.provider} />
                  <input type="hidden" name="enabled" value={config.is_enabled ? "false" : "true"} />
                  <Button 
                    type="submit"
                    variant={config.is_enabled ? "destructive" : "secondary"} 
                    size="icon" 
                    title={config.is_enabled ? "Disable provider" : "Enable provider"}
                  >
                    {config.is_enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
