import * as React from "react"

export function BackgroundScroll() {
  const [randomSeed] = React.useState(() => {
    const p = new URLSearchParams(location.search).get("seed")
    return p ? Number(p) : Math.floor(Math.random() * 10000)
  })

  const leftSrc = `https://picsum.photos/1600/2200?random=${randomSeed}_1`
  const rightSrc = `https://picsum.photos/1600/2200?random=${randomSeed}_2`

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 居中双翼背景图：紧凑间距，优雅留白 */}
      <div className="mx-auto flex h-full w-full justify-center gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4">
        {/* 靠左侧背景图 */}
        <div className="relative w-1/2 max-w-[1300px] h-[85vh] sm:h-[90vh] min-h-[520px] -top-6 rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-2xl transition-opacity duration-700 border border-white/25 dark:border-white/10">
          <img
            src={leftSrc}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover opacity-30 dark:opacity-20 filter saturate-[65%]"
          />
          {/* 边缘融合与底部渐隐 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/50 dark:to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        {/* 靠右侧背景图（错落排布，更有层次） */}
        <div className="relative w-1/2 max-w-[1300px] h-[85vh] sm:h-[90vh] min-h-[520px] top-16 sm:top-20 rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-2xl transition-opacity duration-700 border border-white/25 dark:border-white/10">
          <img
            src={rightSrc}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover opacity-30 dark:opacity-20 filter saturate-[65%]"
          />
          {/* 边缘融合与底部渐隐 */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/50 dark:to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  )
}

