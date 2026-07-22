export const PORTFOLIO_NOTIFICATION_SOUND_SRC = "/sounds/portfolio-notification-open.mp3"

export function stopPortfolioNotificationSound(audio: HTMLAudioElement | null) {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

export function createPortfolioNotificationSound() {
  if (typeof window === "undefined") return null
  const audio = new Audio(PORTFOLIO_NOTIFICATION_SOUND_SRC)
  audio.loop = true
  audio.preload = "auto"
  audio.playsInline = true
  audio.setAttribute("playsinline", "true")
  return audio
}

export async function playPortfolioNotificationSound(audio: HTMLAudioElement | null): Promise<boolean> {
  if (!audio) return false
  audio.currentTime = 0
  try {
    await audio.play()
    return true
  } catch (error) {
    console.warn("Portfolio notification sound blocked:", error)
    return false
  }
}
