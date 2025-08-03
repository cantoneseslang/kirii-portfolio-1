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
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // 音声認識初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // モバイル環境の検出
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // 音声認識
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition()
          recognitionRef.current.continuous = false
          recognitionRef.current.interimResults = false
          recognitionRef.current.lang = 'zh-TW' // 台湾語（広東語の認識が改善される場合がある）
          recognitionRef.current.maxAlternatives = 1
          
          // モバイル用の設定
          if (isMobile) {
            // モバイルではより短いタイムアウト
            recognitionRef.current.maxAlternatives = 1
          }
          
          recognitionRef.current.onstart = () => {
            setIsListening(true)
            setError("")
          }
          
          recognitionRef.current.onresult = async (event) => {
            const transcript = event.results[0][0].transcript
            console.log('🎯 認識結果:', transcript)
            setTranscript(transcript)
            
            // 処理時間計測開始
            startTimeRef.current = Date.now()
            
            // MiniMax APIで応答生成
            await generateResponse(transcript)
          }
          
          recognitionRef.current.onerror = (event) => {
            setIsListening(false)
            
            // エラーメッセージの詳細化
            let errorMessage = `音声認識エラー: ${event.error}`
            if (event.error === 'not-allowed') {
              errorMessage = 'マイクの権限が拒否されました。ブラウザの設定でマイクを許可してください。'
            } else if (event.error === 'no-speech') {
              errorMessage = '音声が検出されませんでした。もう一度試してください。'
            } else if (event.error === 'network') {
              errorMessage = 'ネットワークエラーが発生しました。'
            } else if (event.error === 'aborted') {
              errorMessage = '音声認識が中断されました。'
            }
            
            setError(errorMessage)
          }
          
          recognitionRef.current.onend = () => {
            setIsListening(false)
          }
          
          // 音声認識の権限を事前にチェック
          checkMicrophonePermission()
          setIsInitialized(true)
        } catch (error) {
          console.error('❌ SpeechRecognition初期化エラー:', error)
          setError('音声認識の初期化に失敗しました')
          setIsInitialized(true)
        }
      } else {
        setError('お使いのブラウザは音声認識をサポートしていません。ChromeまたはSafariをお試しください。')
        setIsInitialized(true)
      }
      
      // 音声合成
      synthesisRef.current = window.speechSynthesis
    }
  }, [])

  // MiniMax APIで応答生成（直接呼び出し）
  const generateResponse = async (input: string) => {
    if (isProcessing) {
      console.log('⏳ 既に処理中です')
      return
    }
    
    setIsProcessing(true)
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        // 1. 直接ChatCompletion API呼び出し
        console.log('🤖 ChatCompletion API呼び出し中...')
        const chatResponse = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJIIFNha29uIiwiVXNlck5hbWUiOiJIIFNha29uIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4NjIwNjE3MzAxMDQ4NzM2NDYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxODYyMDYxNzMwMDk2NDg1MDM4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiYmVzdGlua3NhbGVzbWFuQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA4LTAzIDE1OjMyOjIzIiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.tIDxKjAEo4JWvaPZmcvc3LJUseCyoEW3_6yvKWkx_kB4b4A6eaU_8eUeZtyJQrtILvSAeovjwVt107xJOamPjg_WSe2i0YLShy4SNqfVTKxHa5sqQ_aC0-dXcOJ4bvWvBHB34gLT9FgOrwAl8lLeiCMYFxAfBtAKtWcl6inyZpRiVhDcOZMnhl5rXDBxth_DFhUIhH2bEJf_Y7rYjqnj7fNp_M3yfxGmADlPNdVlBUTD4QWHHpblwN-Ljk9IU9cmqclUDJ35PAnx7rI98CzHNmUw9k3vjFmbVlwgWVEY59_AGBt3pkMB_NhLZpcwtHD4ThwhW7xIuJ1_H6y6kM47yA',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "MiniMax-M1",
            messages: [
              {
                role: "system",
                content: "你是一個廣東話聊天機器人。你必須只使用廣東話（粵語）回答，絕對不能使用普通話或簡體字。請用純正的廣東話口語回答，使用繁體字。重要：所有文字必須使用繁體字，不能使用簡體字。例如：'聽到啦！有咩可以幫到你？' 而不是 '听到啦！有什么可以帮到你？'。如果你看到簡體字，請立即轉換為繁體字。"
              },
              {
                role: "user",
                content: input
              }
            ],
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text()
          console.error('❌ ChatCompletion API エラー:', chatResponse.status, errorText)
          if ((chatResponse.status === 504 || chatResponse.status === 408) && retryCount < maxRetries - 1) {
            retryCount++
            console.log(`⏳ ChatCompletion API呼び出しタイムアウト、リトライ ${retryCount}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, 3000))
            continue
          }
          throw new Error(`ChatCompletion API呼び出しエラー: ${chatResponse.status}`)
        }

        const chatData = await chatResponse.json()
        
        // APIキーエラーのチェック
        if (chatData.base_resp?.status_code === 1004) {
          throw new Error('APIキーが無効です。新しいAPIキーを取得してください。')
        }
        
        const response = chatData.choices?.[0]?.message?.content || '抱歉，我無法理解你的問題。'
        const traditionalResponse = convertToTraditional(response)
        console.log('🤖 MiniMax応答:', {
          success: true,
          response: traditionalResponse
        })
        
        setResponse(traditionalResponse)

        // 2. 直接T2A API呼び出し
        console.log('🔊 T2A API呼び出し中...')
        const t2aResponse = await fetch('https://api.minimax.io/v1/t2a_v2', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJIIFNha29uIiwiVXNlck5hbWUiOiJIIFNha29uIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4NjIwNjE3MzAxMDQ4NzM2NDYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxODYyMDYxNzMwMDk2NDg1MDM4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiYmVzdGlua3NhbGVzbWFuQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA4LTAzIDE1OjMyOjIzIiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.tIDxKjAEo4JWvaPZmcvc3LJUseCyoEW3_6yvKWkx_kB4b4A6eaU_8eUeZtyJQrtILvSAeovjwVt107xJOamPjg_WSe2i0YLShy4SNqfVTKxHa5sqQ_aC0-dXcOJ4bvWvBHB34gLT9FgOrwAl8lLeiCMYFxAfBtAKtWcl6inyZpRiVhDcOZMnhl5rXDBxth_DFhUIhH2bEJf_Y7rYjqnj7fNp_M3yfxGmADlPNdVlBUTD4QWHHpblwN-Ljk9IU9cmqclUDJ35PAnx7rI98CzHNmUw9k3vjFmbVlwgWVEY59_AGBt3pkMB_NhLZpcwtHD4ThwhW7xIuJ1_H6y6kM47yA',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'speech-02-turbo',
            text: traditionalResponse,
            voice_setting: {
              voice_id: 'Cantonese_ProfessionalHost（F)',
              speed: 1.0,
              vol: 1.0,
              pitch: 0,
              emotion: 'happy'
            },
            audio_setting: {
              sample_rate: 24000,
              bitrate: 128000,
              format: 'mp3',
              channel: 1
            },
            language_boost: 'Chinese,Yue'
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (!t2aResponse.ok) {
          const errorText = await t2aResponse.text()
          console.error('❌ T2A API エラー:', t2aResponse.status, errorText)
          throw new Error(`T2A API呼び出しエラー: ${t2aResponse.status}`)
        }

        const t2aData = await t2aResponse.json()
        const audioData = t2aData?.data?.audio

        if (audioData) {
          if (startTimeRef.current) {
            const endTime = Date.now()
            const timeDiff = endTime - startTimeRef.current
            setProcessingTime(timeDiff)
            console.log(`⏱️ 処理時間: ${timeDiff}ms`)
          }
          
          playAudioFromHex(audioData)
        } else {
          setError('音声データの取得に失敗しました')
        }
        
        // 成功したらループを抜ける
        break
        
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          console.error('❌ 最大リトライ回数に達しました:', error)
          setError('応答生成に失敗しました（タイムアウト）')
        } else {
          console.log(`⏳ エラーが発生、リトライ ${retryCount}/${maxRetries}:`, error)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    setIsProcessing(false)
  }

  // 音声認識開始（ボタン押下時）
  const startListening = () => {
    // モバイル環境の検出
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        // モバイルでは少し遅延を入れる
        if (isMobile) {
          setTimeout(() => {
            recognitionRef.current?.start()
          }, 100)
        } else {
          recognitionRef.current.start()
        }
      } catch (error) {
        setError('音声認識を開始できませんでした')
      }
    }
  }

  // 音声認識停止（ボタン離し時）
  const stopListening = () => {
    // モバイル環境の検出
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (recognitionRef.current && isListening) {
      // モバイルでは少し遅延を入れる
      if (isMobile) {
        setTimeout(() => {
          recognitionRef.current?.stop()
        }, 50)
      } else {
        recognitionRef.current.stop()
      }
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
      console.log('🔊 音声再生開始:', hexAudio.substring(0, 50) + '...')
      
      // 既存の音声を停止
      if (synthesisRef.current && isSpeaking) {
        synthesisRef.current.cancel()
        setIsSpeaking(false)
      }
      
      // AudioContextの初期化を安全に行う
      let audioContext: AudioContext | null = null
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      } catch (error) {
        console.error('❌ AudioContext初期化エラー:', error)
        setError('音声再生に失敗しました（AudioContext初期化エラー）')
        return
      }
      
      if (!audioContext) {
        setError('音声再生に失敗しました（AudioContext未対応）')
        return
      }
      
      // 16進数文字列をバイナリデータに変換
      const hexString = hexAudio.replace(/[^0-9a-fA-F]/g, '') // 16進数以外の文字を除去
      console.log('🔊 16進数データ長:', hexString.length)
      
      if (hexString.length === 0) {
        console.error('❌ 音声データが空です')
        setError('音声データが空です')
        audioContext.close()
        return
      }
      
      const arrayBuffer = new ArrayBuffer(hexString.length / 2)
      const view = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < hexString.length; i += 2) {
        view[i / 2] = parseInt(hexString.substr(i, 2), 16)
      }

      console.log('🔊 バイナリデータ作成完了、デコード開始')
      
      audioContext.decodeAudioData(arrayBuffer, (buffer) => {
        console.log('🔊 音声デコード成功、再生開始')
        const source = audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext!.destination)
        
        setIsSpeaking(true)
        
        source.onended = () => {
          console.log('🔊 音声再生完了')
          setIsSpeaking(false)
          // AudioContextを閉じる（メモリリーク防止）
          audioContext!.close()
        }
        
        source.start(0)
      }, (error) => {
        console.error('❌ 音声デコードエラー:', error)
        setError('音声デコードに失敗しました')
        setIsSpeaking(false)
        audioContext!.close()
      })
    } catch (error) {
      console.error('❌ 音声再生エラー:', error)
      setError('音声再生に失敗しました')
      setIsSpeaking(false)
    }
  }

  // テスト用音声
  const testVoice = () => {
    setError('テスト機能はMiniMax音声合成のみのため無効です')
  }

  // マイク権限チェック
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // ストリームを停止
    } catch (error) {
      setError('マイクの権限が必要です。ブラウザの設定でマイクを許可してください。')
    }
  }

  // 簡体字を繁体字に変換する関数
  const convertToTraditional = (text: string): string => {
    const simplifiedToTraditional: { [key: string]: string } = {
      '听': '聽',
      '说': '說',
      '话': '話',
      '语': '語',
      '现': '現',
      '现': '現',
      '只': '只',
      '可': '可',
      '以': '以',
      '用': '用',
      '文': '文',
      '字': '字',
      '同': '同',
      '你': '你',
      '沟': '溝',
      '通': '通',
      '没': '沒',
      '有': '有',
      '语': '語',
      '音': '音',
      '功': '功',
      '能': '能',
      '不': '不',
      '过': '過',
      '你': '你',
      '有': '有',
      '咩': '咩',
      '想': '想',
      '讲': '講',
      '都': '都',
      '可': '可',
      '以': '以',
      '打': '打',
      '字': '字',
      '俾': '俾',
      '我': '我',
      '尽': '盡',
      '量': '量',
      '帮': '幫',
      '你': '你',
      '解': '解',
      '答': '答',
      '啦': '啦',
      '哦': '哦',
      '嘅': '嘅',
      '麦': '麥',
      '克': '克',
      '风': '風',
      '可': '可',
      '能': '能',
      '未': '未',
      '开': '開',
      '启': '啟',
      '或': '或',
      '者': '者',
      '有': '有',
      '问': '問',
      '题': '題',
      '检': '檢',
      '查': '查',
      '下': '下',
      '设': '設',
      '备': '備',
      '嘅': '嘅',
      '音': '音',
      '量': '量',
      '设': '設',
      '置': '置',
      '同': '同',
      '埋': '埋',
      '应': '應',
      '用': '用',
      '权': '權',
      '限': '限',
      '啦': '啦',
      '如': '如',
      '果': '果',
      '系': '係',
      '手': '手',
      '机': '機',
      '嘅': '嘅',
      '话': '話',
      '试': '試',
      '下': '下',
      '重': '重',
      '启': '啟',
      '或': '或',
      '者': '者',
      '搵': '搵',
      '维': '維',
      '修': '修',
      '人': '人',
      '员': '員',
      '帮': '幫',
      '手': '手',
      '哦': '哦'
    }
    
    let result = text
    for (const [simplified, traditional] of Object.entries(simplifiedToTraditional)) {
      result = result.replace(new RegExp(simplified, 'g'), traditional)
    }
    return result
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
            
            {/* モバイル用トラブルシューティング */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 モバイルでのトラブルシューティング:</h3>
              <ul className="text-blue-900 text-sm space-y-1">
                <li>• マイクの権限を許可してください</li>
                <li>• ChromeまたはSafariブラウザを使用してください</li>
                <li>• 音声認識が動作しない場合は、ブラウザを再読み込みしてください</li>
                <li>• 静かな環境で話してください</li>
                <li>• 広東語で話してください</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 