import * as React from "react"

export function BackgroundScroll() {
  const [randomSeed] = React.useState(() => Math.floor(Math.random() * 10000))

  const leftSrc = `https://picsum.photos/1200/1600?random=${randomSeed}_1`
  const rightSrc = `https://picsum.photos/1200/1600?random=${randomSeed}_2`

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 靠左侧背景图 */}
      <div className="absolute -top-10 -left-12 sm:left-4 lg:left-10 w-[70vw] sm:w-[44vw] max-w-[640px] h-[70vh] sm:h-[80vh] min-h-[480px] rounded-[36px] overflow-hidden shadow-2xl transition-opacity duration-700">
        <img
          src={leftSrc}
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover opacity-85 dark:opacity-40"
        />
        {/* 柔和边缘融合 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30 dark:to-background/50" />
      </div>

      {/* 靠右侧背景图（错落排布，更有层次） */}
      <div className="absolute top-24 sm:top-36 -right-12 sm:right-4 lg:right-10 w-[70vw] sm:w-[44vw] max-w-[640px] h-[70vh] sm:h-[80vh] min-h-[480px] rounded-[36px] overflow-hidden shadow-2xl transition-opacity duration-700">
        <img
          src={rightSrc}
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover opacity-85 dark:opacity-40"
        />
        {/* 柔和边缘融合 */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/30 dark:to-background/50" />
      </div>

      {/* 中间自然留出的空白间隔区域 */}
    </div>
  )
}

