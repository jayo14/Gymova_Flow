"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Save, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { listAiModelConfigs, saveAiModelConfig, toggleAiModel } from "../actions"
import { useState, useTransition, useRef } from "react"

const PROVIDER_META: Record<string, { logo: string; logoInvert?: boolean }> = {
  openai: {
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg",
    logoInvert: true,
  },
  anthropic: {
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anthropic.svg",
    logoInvert: true,
  },
  google: {
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlegemini.svg",
  },
  xai: {
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg",
    logoInvert: true,
  },
  deepseek: {
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/deepseek.svg",
  },
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Never updated"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

type Config = Awaited<ReturnType<typeof listAiModelConfigs>>[number]

export function ProviderCard({
  config,
  isActive,
}: {
  config: Config
  isActive: boolean
}) {
  const [keyVisible, setKeyVisible] = useState(false)
  const [apiKey, setApiKey] = useState(config.api_key ?? "")
  const [modelName, setModelName] = useState(config.model_name ?? "")
  const [enabled, setEnabled] = useState(config.is_enabled)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const meta = PROVIDER_META[config.provider] ?? {}
  const hasKey = apiKey.trim().length > 0

  function handleSave() {
    const formData = new FormData()
    formData.set("provider", config.provider)
    formData.set("model_name", modelName)
    formData.set("api_key", apiKey)

    startTransition(async () => {
      await saveAiModelConfig(formData)
      setSaved(true)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleToggle(checked: boolean) {
    setEnabled(checked)
    const formData = new FormData()
    formData.set("provider", config.provider)
    formData.set("enabled", String(checked))
    startTransition(() => toggleAiModel(formData))
  }

  return (
    <Card
      className={`bg-card border transition-colors ${
        isActive && enabled && hasKey
          ? "border-blue-500/40 dark:border-blue-400/30"
          : "border-border"
      }`}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
            {meta.logo ? (
              <img
                src={meta.logo}
                alt={config.display_name}
                className={`w-5 h-5 object-contain dark:invert ${meta.logoInvert ? "invert dark:invert-0" : ""}`}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {config.display_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{config.display_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatUpdatedAt(config.updated_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          {isActive && enabled && hasKey && (
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs gap-1 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              Active
            </Badge>
          )}
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="pt-4 space-y-3">
        {/* Model name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Model
          </label>
          <Input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder={config.default_model ?? "e.g. gpt-4o"}
            className="bg-muted/40 border-border font-mono text-sm h-9"
          />
        </div>

        {/* API key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            API key
          </label>
          <div className="relative">
            <Input
              type={keyVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              autoComplete="off"
              spellCheck={false}
              className="bg-muted/40 border-border font-mono text-sm h-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setKeyVisible((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title={keyVisible ? "Hide key" : "Show key"}
            >
              {keyVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {hasKey
              ? `Key ending in ···${apiKey.slice(-4)}`
              : "No key configured"}
          </p>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className={`h-8 px-3 text-xs gap-1.5 transition-all ${
              saved
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
                : "bg-background border border-border text-foreground hover:bg-muted"
            }`}
            variant="outline"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
