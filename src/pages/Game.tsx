import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import ChatBox from '../components/ChatBox'
import type { TMessage } from '../types/message'
import { stories } from '../data/stories'
import { InvalidAIAnswerError, askAI } from '../lib/api'
import type { TUserApiConfig } from '../lib/userApiConfig'
import { loadUserApiConfig } from '../lib/userApiConfig'

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function Game() {
  const { id } = useParams()
  const location = useLocation()
  const story = useMemo(() => {
    return stories.find((s) => s.id === id)
  }, [id])

  const [messages, setMessages] = useState<TMessage[]>(() => {
    const state = location.state as { messages?: TMessage[] } | undefined
    return state?.messages
      ? state.messages.filter((m) => m.role !== 'system')
      : []
  })
  const [pending, setPending] = useState(false)
  const [bottom, setBottom] = useState<string | null>(null)
  const [bottomLoading, setBottomLoading] = useState(() => !!story)
  const [bottomError, setBottomError] = useState<string | null>(null)

  const [userApiConfig] = useState<TUserApiConfig | null>(
    () => loadUserApiConfig('local') ?? loadUserApiConfig('session'),
  )

  useEffect(() => {
    // 从后端按需获取 bottom，避免前端静态包里直接携带汤底全文
    if (!story) return
    let cancelled = false

    fetch(`/api/story-bottom/${story.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text().catch(() => '')
          throw new Error(
            `加载汤底失败（HTTP ${res.status}${t ? `: ${t.slice(0, 60)}` : ''}）`,
          )
        }
        return res.json() as Promise<{ bottom: string }>
      })
      .then((data) => {
        if (cancelled) return
        setBottom(data.bottom)
      })
      .catch((e) => {
        if (cancelled) return
        setBottomError(e instanceof Error ? e.message : '加载汤底失败')
      })
      .finally(() => {
        if (cancelled) return
        setBottomLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [story])

  const onSend = async (question: string) => {
    if (!story) return
    if (!bottom) return
    if (!userApiConfig) return
    if (pending) return

    const userMessage: TMessage = {
      id: uid(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPending(true)

    try {
      const answer = await askAI(
        question,
        { surface: story.surface, bottom },
        userApiConfig,
      )
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: answer,
          timestamp: Date.now(),
        },
      ])
    } catch (e) {
      const content =
        e instanceof InvalidAIAnswerError
          ? 'AI 暂时无法给出合规的“是/否/无关”。请尝试换个更明确的问法～'
          : e instanceof Error
            ? `系统提示：${e.message}`
            : '网络连接似乎出了问题，请检查后重试。'

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'system',
          content,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  const handleEndGame = () => {
    setMessages([])
    setPending(false)
  }

  return (
    <main className="relative px-4 py-10 sm:py-14 max-w-3xl mx-auto text-slate-200">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          游戏进行中
        </h1>

        {story ? (
          <p className="text-neon-400/90 text-sm sm:text-base">
            {story.title} · 汤面已加载
          </p>
        ) : (
          <p className="text-slate-400 text-sm sm:text-base">
            未找到该故事：{id ?? 'unknown'}
          </p>
        )}
      </div>

      {/* 汤面（surface）展示 */}
      {story && (
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-6 py-5 mb-6 text-left">
          <h2 className="text-slate-200 font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-neon-400 rounded-full" />
            汤面（Story Surface）
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {story.surface}
          </p>
        </section>
      )}

      {/* 聊天 UI */}
      <ChatBox
        messages={messages}
        onSend={onSend}
        disabled={!story || !bottom || !userApiConfig || bottomLoading || !!bottomError}
        loading={pending}
        placeholder={
          !userApiConfig
            ? '请先回首页配置 DeepSeek API Key（BYOK）。'
            : !bottom
              ? '加载汤底中…'
              : '输入你的问题（回车发送，Shift+回车换行）'
        }
      />

      {/* 底部按钮（查看汤底/结束游戏） */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-stretch">
        <Link
          to={story ? `/result/${story.id}` : '/'}
          state={{ messages, bottom }}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
        >
          查看汤底
        </Link>

        <button
          onClick={handleEndGame}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-slate-200 bg-white/5 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-bg-950"
        >
          结束游戏
        </button>
      </div>

      <div className="mt-4 text-center text-slate-500 text-xs">
        提示：AI 只会回答“是 / 否 / 无关”，请据此推理真相。
        {bottomError ? ` | 汤底加载失败：${bottomError}` : ''}
      </div>
    </main>
  )
}

