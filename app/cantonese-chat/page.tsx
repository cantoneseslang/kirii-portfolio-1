"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

export default function CantoneseChatPage() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // 音声認識初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔧 音声認識初期化開始')
      // 音声認識
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        console.log('✅ SpeechRecognition API 利用可能')
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'zh-TW' // 台湾語（広東語の認識が改善される場合がある）
        recognitionRef.current.maxAlternatives = 1
        
        recognitionRef.current.onstart = () => {
          console.log('🎤 音声認識開始')
          setIsListening(true)
          setError("")
        }
        
        recognitionRef.current.onresult = async (event) => {
          const transcript = event.results[0][0].transcript
          console.log('🎯 認識結果:', transcript)
          setTranscript(transcript)
          
          // 処理時間計測開始
          startTimeRef.current = Date.now()
          console.log('⏱️ 処理時間計測開始')
          
          // MiniMax APIで応答生成
          await generateResponse(transcript)
        }
        
        recognitionRef.current.onerror = (event) => {
          console.log('❌ 音声認識エラー:', event.error)
          setIsListening(false)
          if (event.error !== 'no-speech') {
            setError(`音声認識エラー: ${event.error}`)
          }
        }
        
        recognitionRef.current.onend = () => {
          console.log('🎤 音声認識終了')
          setIsListening(false)
        }
      } else {
        console.error('❌ SpeechRecognition API 利用不可')
        setError('お使いのブラウザは音声認識をサポートしていません')
      }
      
      // 音声合成
      synthesisRef.current = window.speechSynthesis
    }
  }, [])

  // MiniMax APIで応答生成
  const generateResponse = async (input: string) => {
    try {
      console.log('🤖 MiniMax API呼び出し中...')
      const response = await fetch('/api/minimax-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          language: 'cantonese'
        })
      })
      
      if (!response.ok) {
        throw new Error('API呼び出しエラー')
      }
      
      const data = await response.json()
      console.log('🤖 MiniMax応答:', data)
      setResponse(data.response)
      
      if (data.audio) {
        // 処理時間計算
        if (startTimeRef.current) {
          const endTime = Date.now()
          const timeDiff = endTime - startTimeRef.current
          setProcessingTime(timeDiff)
          console.log(`⏱️ 処理時間: ${timeDiff}ms`)
        }
        
        // MiniMaxの音声データを再生
        console.log('🔊 音声データを再生します')
        playAudioFromHex(data.audio)
      } else {
        setError('MiniMax音声合成に失敗しました')
      }
      
    } catch (error) {
      console.error('❌ 応答生成エラー:', error)
      setError('応答生成に失敗しました')
    }
  }

  // 音声認識開始（ボタン押下時）
  const startListening = () => {
    console.log('🔘 マイクボタン押下 - 音声認識開始試行')
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        console.log('🎤 音声認識開始実行')
        recognitionRef.current.start()
      } catch (error) {
        console.error('❌ 音声認識開始エラー:', error)
        setError('音声認識を開始できませんでした')
      }
    } else {
      console.log('❌ 音声認識開始条件不満足:', {
        hasRecognition: !!recognitionRef.current,
        isListening,
        isSpeaking
      })
    }
  }

  // 音声認識停止（ボタン離し時）
  const stopListening = () => {
    console.log('🔘 マイクボタン離し - 音声認識停止試行')
    if (recognitionRef.current && isListening) {
      console.log('🎤 音声認識停止実行')
      recognitionRef.current.stop()
    }
  }

  // 音声合成停止
  const stopSpeaking = () => {
    if (synthesisRef.current && isSpeaking) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  // 16進数音声データを再生
  const playAudioFromHex = (hexAudio: string) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // 16進数文字列をバイナリデータに変換
      const hexString = hexAudio.replace(/[^0-9a-fA-F]/g, '') // 16進数以外の文字を除去
      
      const arrayBuffer = new ArrayBuffer(hexString.length / 2)
      const view = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < hexString.length; i += 2) {
        view[i / 2] = parseInt(hexString.substr(i, 2), 16)
      }

      audioContext.decodeAudioData(arrayBuffer, (buffer) => {
        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext.destination)
        source.start(0)

        setIsSpeaking(true)
        source.onended = () => {
          setIsSpeaking(false)
        }
      }, (error) => {
        setError('音声デコードに失敗しました')
        setIsSpeaking(false)
      })
    } catch (error) {
      setError('音声再生に失敗しました')
      setIsSpeaking(false)
    }
  }

  // テスト用音声
  const testVoice = () => {
    setError('テスト機能はMiniMax音声合成のみのため無効です')
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🗣️ 廣東話聊天機器人
            </CardTitle>
            <p className="text-gray-600">MiniMax AI による音声チャット</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {/* 音声認識結果 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🎤 認識した言葉:</h3>
              <p className="text-blue-900">{transcript || "音声を待機中..."}</p>
            </div>
            
            {/* AI応答 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🤖 AI応答:</h3>
              <p className="text-green-900">{response || "応答を待機中..."}</p>
            </div>
            
            {/* 処理時間表示 */}
            {processingTime && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">⏱️ 処理時間:</h3>
                <p className="text-purple-900">
                  {processingTime}ms (音声認識完了 → 音声再生開始)
                </p>
                <p className="text-purple-700 text-sm mt-1">
                  {processingTime < 1000 ? '🚀 高速' : processingTime < 2000 ? '⚡ 良好' : '🐌 遅い'}
                </p>
              </div>
            )}
            
            {/* コントロールボタン */}
            <div className="flex justify-center space-x-4">
              {/* マイクボタン - 長押しで音声認識 */}
              <Button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                disabled={isSpeaking}
                className={`${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-all duration-200`}
                style={{ 
                  transform: isListening ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    話し中...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    長押しで話す
                  </>
                )}
              </Button>
              
              {isSpeaking ? (
                <Button
                  onClick={stopSpeaking}
                  variant="destructive"
                >
                  <VolumeX className="w-5 h-5 mr-2" />
                  音声停止
                </Button>
              ) : (
                <Button
                  onClick={testVoice}
                  disabled={isListening}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  テスト音声
                </Button>
              )}
            </div>
            
            {/* ステータス表示 */}
            <div className="text-center text-sm text-gray-600">
              {isListening && <p>🎤 音声認識中... (ボタンを離すと停止)</p>}
              {isSpeaking && <p>🔊 音声合成中...</p>}
              {!isListening && !isSpeaking && <p>⏳ マイクボタンを長押しして話してください</p>}
            </div>
            
            {/* 使用方法説明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">📱 使用方法:</h3>
              <ul className="text-yellow-900 text-sm space-y-1">
                <li>• マイクボタンを長押しして話してください</li>
                <li>• 話し終わったらボタンを離してください</li>
                <li>• AIが広東語で応答します</li>
                <li>• 携帯での使用に最適化されています</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 