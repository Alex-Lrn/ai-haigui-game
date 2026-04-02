import { useState } from 'react'
import GameCard from '../components/GameCard'
import { stories } from '../data/stories'
import type { TUserApiConfig, TUserApiStatus } from '../lib/userApiConfig'
import {
  clearUserApiConfig,
  loadUserApiConfig,
  saveUserApiConfig,
  validateUserApiConfig,
} from '../lib/userApiConfig'

export default function Home() {
  const initialConfig =
    loadUserApiConfig('local') ?? loadUserApiConfig('session')

  const [apiState, setApiState] = useState<TUserApiStatus>(() =>
    initialConfig ? { status: 'ready', config: initialConfig } : { status: 'empty' },
  )
  const [apiKey, setApiKey] = useState(() => initialConfig?.apiKey ?? '')
  const [model, setModel] = useState(
    () => initialConfig?.model ?? 'deepseek-chat',
  )
  const [endpoint, setEndpoint] = useState(
    () => initialConfig?.endpoint ?? 'https://api.deepseek.com/chat/completions',
  )
  const [saveMode, setSaveMode] = useState<'local' | 'session'>('session')
  const [showConfig, setShowConfig] = useState(false)

  const onValidate = async () => {
    if (apiState.status === 'validating') return

    const config: TUserApiConfig = {
      apiKey: apiKey.trim(),
      model: model.trim(),
      endpoint: endpoint.trim(),
    }

    if (!config.apiKey) {
      setApiState({ status: 'error', message: '请先填写 API Key' })
      return
    }

    setApiState({ status: 'validating' })
    try {
      await validateUserApiConfig(config)
      saveUserApiConfig(config, saveMode)
      setApiState({ status: 'ready', config })
      setShowConfig(false)
    } catch (e) {
      setApiState({
        status: 'error',
        message:
          e instanceof Error ? e.message : 'API 配置校验失败，请检查后重试。',
      })
    }
  }

  const onClear = () => {
    clearUserApiConfig()
    setApiState({ status: 'empty' })
    setApiKey('')
    setModel('deepseek-chat')
    setEndpoint('https://api.deepseek.com/chat/completions')
    setShowConfig(true)
  }

  return (
    <main className="relative px-4 py-12 sm:py-20 max-w-3xl mx-auto text-center">
      {/* 海龟 emoji + 标题 */}
      <p className="text-5xl sm:text-6xl mb-4 animate-floaty" aria-hidden>
        🐢
      </p>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
        <span className="drop-shadow-[0_0_20px_rgba(45,226,255,0.5)] text-neon-400 animate-glow">
          AI 海龟汤
        </span>
      </h1>
      <p className="text-neon-400/90 text-lg sm:text-xl mb-10 font-medium">
        霓虹谜案 · 一问一答揭开真相
      </p>

      <p className="text-neon-400/90 text-lg sm:text-xl mb-8 font-medium">
        选择一段“汤面”，向 AI 主持人发问：只会得到“是/否/无关”。
      </p>

      {/* BYOK 配置入口 */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-6 py-6 text-left">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-slate-200 font-semibold text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-neon-400 rounded-full" />
              API Key 配置（BYOK）
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              {apiState.status === 'ready'
                ? `已启用：模型 ${apiState.config.model}`
                : apiState.status === 'validating'
                  ? '校验中…'
                  : apiState.status === 'error'
                    ? `配置异常：${apiState.message}`
                    : '尚未配置。需要你的 DeepSeek API Key 才能让 AI 回答。'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            {apiState.status === 'ready' ? (
              <button
                onClick={() => setShowConfig((v) => !v)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
              >
                修改
              </button>
            ) : (
              <button
                onClick={() => setShowConfig(true)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
              >
                去配置
              </button>
            )}
            {apiState.status !== 'empty' && (
              <button
                onClick={onClear}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-slate-200 bg-white/5 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-bg-950"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {showConfig && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="grid gap-3 sm:grid-cols-1">
              <label className="text-slate-300 text-sm">
                API Key
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  placeholder="sk-xxxx..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg-900/30 px-3 py-2 outline-none text-slate-200 placeholder:text-slate-500"
                />
              </label>

              <label className="text-slate-300 text-sm">
                模型
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg-900/30 px-3 py-2 outline-none text-slate-200 placeholder:text-slate-500"
                />
              </label>

              <label className="text-slate-300 text-sm">
                Endpoint
                <input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg-900/30 px-3 py-2 outline-none text-slate-200 placeholder:text-slate-500"
                />
              </label>

              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={saveMode === 'local'}
                  onChange={(e) => setSaveMode(e.target.checked ? 'local' : 'session')}
                />
                保存到本地（浏览器持久化）；不勾选则仅当前会话保存
              </label>

              <div className="flex gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => void onValidate()}
                  disabled={apiState.status === 'validating'}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-bg-950 bg-neon-400 shadow-neon-sm hover:shadow-neon hover:bg-neon-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {apiState.status === 'validating' ? '正在校验…' : '校验并启用'}
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
                >
                  收起
                </button>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed">
                提示：你提供的 Key 将被用于浏览器端请求第三方大模型。费用与合规风险由你承担；建议不要在公共设备保存 Key。
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 游戏大厅：故事卡片网格 */}
      <section className="mt-10 text-left">
        <h2 className="text-slate-200 font-semibold text-lg mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-neon-400 rounded-full" />
          海龟汤关卡
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {stories.map((story) => (
            <GameCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* 简短规则提示 */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-6 py-6 text-left">
        <h3 className="text-slate-200 font-semibold text-md mb-2">规则速记</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          AI 主持人只会回答“是 / 否 / 无关”。不要追问解释，让推理自己把真相逼出来。
        </p>
      </div>
    </main>
  )
}

