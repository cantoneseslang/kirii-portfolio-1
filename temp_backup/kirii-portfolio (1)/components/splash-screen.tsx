"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(1) // 1: フェードイン, 2: 拡大, 3: ズームアウト

  useEffect(() => {
    // フェーズ1: フェードイン（0〜2秒）
    const phase1Timer = setTimeout(() => {
      setAnimationPhase(2) // 拡大フェーズへ
    }, 2000)

    // フェーズ2: 拡大（2〜2.5秒）
    const phase2Timer = setTimeout(() => {
      setAnimationPhase(3) // ズームアウトフェーズへ
    }, 2500)

    // フェーズ3: ズームアウト（2.5〜3.5秒）
    const phase3Timer = setTimeout(() => {
      setIsVisible(false) // アニメーション終了
      // フェードアウト後にコールバックを実行
      setTimeout(onComplete, 500)
    }, 3500)

    return () => {
      clearTimeout(phase1Timer)
      clearTimeout(phase2Timer)
      clearTimeout(phase3Timer)
    }
  }, [onComplete])

  // アニメーションフェーズに応じたスケール値を設定
  const getScale = () => {
    switch (animationPhase) {
      case 1:
        return 1 // フェードイン中は通常サイズ
      case 2:
        return 1.3 // 拡大フェーズでは1.3倍に
      case 3:
        return 0.2 // ズームアウトフェーズでは0.2倍に
      default:
        return 1
    }
  }

  // アニメーションフェーズに応じた不透明度を設定
  const getOpacity = () => {
    switch (animationPhase) {
      case 1:
        return [0, 1] // フェードイン
      case 2:
        return 1 // 拡大中は完全表示
      case 3:
        return [1, 0] // ズームアウト中にフェードアウト
      default:
        return 1
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-white z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: getOpacity(),
              scale: getScale(),
            }}
            transition={{
              duration: animationPhase === 1 ? 2 : animationPhase === 2 ? 0.5 : 1,
              ease: animationPhase === 3 ? "easeOut" : "easeInOut",
            }}
            className="relative flex items-center justify-center"
          >
            <Image src="/logo.png" alt="KIRII" width={250} height={150} className="h-auto" priority />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

