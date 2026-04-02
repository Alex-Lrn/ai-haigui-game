import { Link } from 'react-router-dom'
import type { TStoryPublic } from '../data/stories'

const difficultyStyles: Record<TStoryPublic['difficulty'], string> = {
  easy: 'bg-slate-500/10 text-slate-200 border-slate-400/20',
  medium: 'bg-indigoGlow-400/10 text-indigoGlow-400 border-indigoGlow-400/25',
  hard: 'bg-neon-400/10 text-neon-400 border-neon-400/25',
}

export default function GameCard({ story }: { story: TStoryPublic }) {
  return (
    <Link
      to={`/game/${story.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-panel p-5 hover:border-neon-400/40 hover:shadow-neon hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">
            {story.title}
          </h3>
          <p
            className="text-slate-300 text-sm leading-relaxed mt-2 overflow-hidden text-ellipsis"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {story.surface}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${difficultyStyles[story.difficulty]}`}
        >
          {story.difficulty === 'easy'
            ? '简单'
            : story.difficulty === 'medium'
              ? '中等'
              : '困难'}
        </span>

        <span className="text-neon-400/80 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          进入游戏 →
        </span>
      </div>
    </Link>
  )
}

