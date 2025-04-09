"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

export function SplashAnimation({ onComplete }: { onComplete: () => void }) {
  const [logoPosition, setLogoPosition] = useState({ rotate: 0, translateX: 0 })
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const [showShine, setShowShine] = useState(false)
  const animationRef = useRef<number | null>(null)
  
  // 揺れるアニメーションのステップを定義（角度を大きく）
  const animationSteps = [
    { rotate: 8, translateX: 6 },   // 右に大きく傾く
    { rotate: -8, translateX: -6 }, // 左に大きく傾く
    { rotate: 1, translateX: 2 },   // 少し右に戻る
    { rotate: 0, translateX: 0 },   // 元の位置に
  ]
  
  useEffect(() => {
    // キラッと光るエフェクトを表示
    setTimeout(() => {
      setShowShine(true)
    }, 100)
    
    // 揺れアニメーションのシーケンス
    const startWobble = () => {
      let step = 0
      let startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const duration = 700 // 全体で700ms
        const progress = Math.min(elapsed / duration, 1)
        
        // 現在のステップを計算
        const currentStep = Math.min(Math.floor(progress * animationSteps.length), animationSteps.length - 1)
        
        if (currentStep !== step) {
          step = currentStep
          setLogoPosition(animationSteps[step])
        }
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          // 揺れアニメーション終了後、ズームアウト開始
          setTimeout(() => {
            // ズームアウトアニメーション
            const startShrink = () => {
              let startTime = Date.now()
              
              const shrink = () => {
                const elapsed = Date.now() - startTime
                const duration = 300 // 300ms でズームアウト
                const progress = Math.min(elapsed / duration, 1)
                
                // スケールを1から0.01に徐々に変更
                const newScale = 1 - (progress * 0.99)
                setScale(newScale)
                
                if (progress < 1) {
                  animationRef.current = requestAnimationFrame(shrink)
                } else {
                  // ズームアウト完了後、フェードアウト
                  const startFade = () => {
                    let startTime = Date.now()
                    
                    const fade = () => {
                      const elapsed = Date.now() - startTime
                      const duration = 200 // 200ms でフェードアウト
                      const progress = Math.min(elapsed / duration, 1)
                      
                      setOpacity(1 - progress)
                      
                      if (progress < 1) {
                        animationRef.current = requestAnimationFrame(fade)
                      } else {
                        onComplete()
                      }
                    }
                    
                    animationRef.current = requestAnimationFrame(fade)
                  }
                  
                  startFade()
                }
              }
              
              animationRef.current = requestAnimationFrame(shrink)
            }
            
            startShrink()
          }, 800) // 揺れた後0.8秒待ってからズームアウト
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // 揺れアニメーションを開始
    setTimeout(startWobble, 200)
    
    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [onComplete])
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
      style={{ opacity }}
    >
      <div
        className="relative"
        style={{ 
          transform: `scale(${scale}) rotate(${logoPosition.rotate}deg) translateX(${logoPosition.translateX}px)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* 光るエフェクト */}
        {showShine && (
          <div 
            className="absolute -left-20 top-0 h-full w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
            style={{ 
              transform: 'rotate(30deg)',
              animation: 'logo-shine 1s ease-in-out forwards'
            }}
          />
        )}
        
        <Image 
          src="/logo.png" 
          alt="KIRII" 
          width={200} 
          height={54} 
          priority 
          className="relative"
        />
      </div>
    </div>
  )
}
