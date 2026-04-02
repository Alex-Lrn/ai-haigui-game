import { Link, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { stories } from '../data/stories'
import type { TMessage } from '../types/message'

export default function Result() {
  const { id } = useParams()
  const location = useLocation()
  const story = stories.find((s) => s.id === id)

  const initialState = location.state as
    | { messages?: TMessage[]; bottom?: string }
    | undefined

  const [visible, setVisible] = useState(false)
  const [messages] = useState<TMessage[]>(() =>
    initialState?.messages
      ? initialState.messages.filter((m) => m.role !== 'system')
      : [],
  )
  const [bottom, setBottom] = useState<string | null>(() => initialState?.bottom ?? null)

  useEffect(() => {
    // 淡入动效
    const timer = setTimeout(() => setVisible(true), 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!story) return
    if (bottom) return

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
      .catch(() => {
        if (cancelled) return
        setBottom('汤底加载失败。请重试或刷新页面。')
      })

    return () => {
      cancelled = true
    }
  }, [story, bottom])

  if (!story) {
    return (
      <main className="relative px-4 py-10 sm:py-14 max-w-3xl mx-auto text-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            未找到故事
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            故事 ID: {id ?? 'unknown'} 不存在
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
          >
            返回大厅
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative px-4 py-10 sm:py-14 max-w-3xl mx-auto text-slate-200">
      {/* 标题区 */}
      <div className={`text-center mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          汤底揭晓
        </h1>
        <p className="text-neon-400/90 text-sm sm:text-base">
          {story.title}
        </p>
      </div>

      {/* 汤底内容 */}
      <section className={`rounded-2xl border border-neon-400/30 bg-gradient-to-br from-neon-400/10 to-white/5 backdrop-blur-sm shadow-panel px-6 py-8 text-left mb-6 transition-all duration-700 delay-150 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-neon-400 rounded-full animate-pulse" />
          真相揭晓
        </h2>
        <div className="relative">
          <p className="text-white text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {bottom ?? '汤底加载中…'}
          </p>
          {/* 装饰性光晕 */}
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-neon-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* 对话历史复盘（如果有） */}
      {messages.length > 0 && (
        <section className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-6 py-6 text-left mb-6 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-slate-200 font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyan-400 rounded-full" />
            你的推理历程
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-neon-400/20 border border-neon-400/30 text-white'
                      : 'bg-white/10 border border-white/10 text-slate-200'
                  }`}
                >
                  <span className="text-xs opacity-60 mr-2">
                    {msg.role === 'user' ? '你' : 'AI'}
                  </span>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-3 text-center">
              共 {messages.length} 轮对话
          </p>
        </section>
      )}

      {/* 操作按钮 */}
      <div className={`mt-8 flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-neon-400 bg-white/5 border border-white/10 hover:border-neon-400/50 hover:bg-neon-400/10 transition-all focus:outline-none focus:ring-2 focus:ring-neon-400 focus:ring-offset-2 focus:ring-offset-bg-950"
        >
          再来一局
        </Link>
        {messages.length > 0 && (
          <Link
            to={`/game/${story.id}`}
            state={{ messages }}
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-slate-200 bg-white/5 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-bg-950"
          >
            继续提问
          </Link>
        )}
      </div>
    </main>
  )
}
