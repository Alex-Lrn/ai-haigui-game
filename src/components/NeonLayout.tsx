import type { ReactNode } from 'react'

export default function NeonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-950 text-slate-200 overflow-x-hidden">
      {/* 背景：深蓝渐变 + 柔光 + 星尘噪点 */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-950 via-bg-900 to-bg-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(45, 226, 255, 0.15), transparent),
                             radial-gradient(ellipse 60% 40% at 80% 60%, rgba(107, 124, 255, 0.08), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      {children}
    </div>
  )
}

