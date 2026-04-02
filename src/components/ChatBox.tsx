import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEventHandler } from 'react'
import type { TMessage } from '../types/message'
import MessageBubble from './MessageBubble'

type TChatBoxProps = {
  messages: TMessage[]
  onSend: (question: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
  loading?: boolean
}

export default function ChatBox({
  messages,
  onSend,
  disabled,
  placeholder,
  loading,
}: TChatBoxProps) {
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  const hasContent = useMemo(() => messages.length > 0, [messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const question = input.trim()
    if (!question) return
    if (disabled) return

    setInput('')
    await onSend(question)
  }

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const defaultPlaceholder =
    placeholder ?? '输入你的问题…（回车发送，Shift+回车换行）'

  return (
    <div className="flex flex-col gap-3">
      {/* 消息列表 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-4 py-4 min-h-[160px]">
        {hasContent ? (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span>AI 思考中…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-neon-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              还没有消息。开始提问吧。
            </p>
            <p className="text-slate-500 text-xs">
              尝试以肯定疑问的方式提问，逼近真相
              <br />
              AI 将只回答：<span className="text-neon-400/80">是</span> / <span className="text-neon-400/80">否</span> / <span className="text-neon-400/80">无关</span>
            </p>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel px-4 py-3 flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={defaultPlaceholder}
            rows={1}
            className="w-full resize-none outline-none bg-transparent text-slate-200 placeholder:text-slate-500 text-sm leading-relaxed"
          />
        </div>

        <button
          onClick={() => void send()}
          disabled={disabled || loading}
          className={`shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-400 ${
            disabled || loading
              ? 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
              : 'bg-neon-400 text-bg-950 shadow-neon-sm hover:shadow-neon hover:bg-neon-500 border border-neon-400/20'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              发送中
            </span>
          ) : (
            '发送'
          )}
        </button>
      </div>
    </div>
  )
}

