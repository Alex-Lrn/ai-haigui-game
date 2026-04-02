import type { TMessage } from '../types/message'

export default function MessageBubble({ message }: { message: TMessage }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] rounded-xl px-4 py-2.5 border border-amber-400/20 bg-amber-400/10 text-amber-200 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-neon-400 text-sm">
          {isAssistant ? '龟' : '系'}
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
          isUser
            ? 'bg-neon-400/10 border-neon-400/30 text-slate-200 shadow-neon-sm'
            : 'bg-white/5 border-white/10 text-slate-200'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
      </div>

      {isUser && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-neon-400 text-sm">
          你
        </div>
      )}
    </div>
  )
}

