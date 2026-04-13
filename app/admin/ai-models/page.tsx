import { listAiModelConfigs } from "../actions"
import { ProviderCard } from "./ProviderCard"

const PROVIDER_ORDER = ["openai", "anthropic", "google", "xai", "deepseek"]

export default async function AIModelsPage() {
  const configs = await listAiModelConfigs()

  const activeProvider = PROVIDER_ORDER.find((provider) =>
    configs.find((c) => c.provider === provider && c.is_enabled && c.api_key)
  )

  const activeConfig = configs.find((c) => c.provider === activeProvider)

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI models</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure API keys and model preferences for each provider. The first
          enabled provider with a valid key becomes active.
        </p>
      </div>

      {/* Active provider status bar */}
      <div className="bg-muted/40 border border-border rounded-lg px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              activeConfig ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
          <div>
            <p className="text-xs text-muted-foreground">Active provider</p>
            <p className="text-base font-medium text-foreground">
              {activeConfig
                ? `${activeConfig.display_name} — ${activeConfig.model_name ?? activeConfig.default_model}`
                : "No active provider"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pl-5 sm:pl-0">
          Priority: OpenAI → Anthropic → Google → xAI → DeepSeek
        </p>
      </div>

      {/* Provider cards */}
      <div className="grid gap-4 xl:grid-cols-2">
        {configs.map((config) => (
          <ProviderCard
            key={config.provider}
            config={config}
            isActive={config.provider === activeProvider}
          />
        ))}
      </div>
    </div>
  )
}
