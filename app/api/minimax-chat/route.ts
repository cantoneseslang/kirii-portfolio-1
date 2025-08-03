import { NextRequest, NextResponse } from 'next/server'

const MINIMAX_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJIIFNha29uIiwiVXNlck5hbWUiOiJIIFNha29uIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4NjIwNjE3MzAxMDQ4NzM2NDYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxODYyMDYxNzMwMDk2NDg1MDM4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiYmVzdGlua3NhbGVzbWFuQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA4LTAzIDEyOjQ0OjE1IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.kXFx-1sQui_YwUeV2COHhcWsqSMWkarPBFAerKx16_v32kluO5Xorrb2dt5nMJeq3vSaKf7hUW63pWP6O64FfDnZbItunJsgfNsVGjGTk6YPSyvJeaHsgAk_f6uo6z8lARY6oqC3XkTIvAHstq6ThmQlRmYKeGW3CYdwCMZGS8D1IKMJjvt3frWlYhs76Uh0MgAya0gYNAWErwXd8h8BMbyhaN2F6mfwdARCx64BHjYaz7FG67I_li3Rq1Iu4KHDN5KYIBm4s2-Mv3fy5x1o02QfRGhHrDTFejytIWdfBYNWh8MKM57TJqs-7jzFAZ-e3CtUzwYlH1o2WzOUAbcjdA'

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { message, language } = await request.json()
    
    console.log('📨 受信メッセージ:', message)
    console.log('🌍 言語:', language)
    
    // MiniMax ChatCompletion v2 API呼び出し
    console.log('🤖 ChatCompletion API呼び出し開始...')
    const chatStartTime = Date.now()
    const minimaxResponse = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "MiniMax-M1",
        messages: [
          {
            role: "system",
            content: "用廣東話回答。"
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    })
    
    const chatEndTime = Date.now()
    console.log(`⏱️ ChatCompletion API 処理時間: ${chatEndTime - chatStartTime}ms`)
    
    if (!minimaxResponse.ok) {
      const errorText = await minimaxResponse.text()
      console.error('❌ MiniMax API エラー:', minimaxResponse.status, errorText)
      throw new Error(`MiniMax API エラー: ${minimaxResponse.status}`)
    }
    
    const data = await minimaxResponse.json()
    console.log('✅ MiniMax API 応答:', data)
    
    const response = data.choices?.[0]?.message?.content || '抱歉，我無法理解你的問題。'
    
    // MiniMax T2A音声合成APIを呼び出し
    console.log('🔊 T2A API呼び出し開始...')
    const t2aStartTime = Date.now()
    const t2aResponse = await fetch('https://api.minimax.io/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-02-turbo',
        text: response,
        voice_setting: {
          voice_id: 'Cantonese_ProfessionalHost（F)', // ユーザーが指定した広東語の声（正確なID）
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
        language_boost: 'Chinese,Yue' // 広東語（粵語）に明示的に設定
      })
    })
    
    const t2aEndTime = Date.now()
    console.log(`⏱️ T2A API 処理時間: ${t2aEndTime - t2aStartTime}ms`)
    
    if (!t2aResponse.ok) {
      console.error('❌ MiniMax T2A API エラー:', t2aResponse.status)
      throw new Error(`MiniMax T2A API エラー: ${t2aResponse.status}`)
    }
    
    const t2aData = await t2aResponse.json()
    console.log('✅ MiniMax T2A API 応答:', t2aData)
    
    const audioData = t2aData?.data?.audio
    
    if (!audioData) {
      console.error('❌ 音声データが見つかりません:', t2aData)
      throw new Error('音声データの取得に失敗しました')
    }
    
    const totalTime = Date.now() - startTime
    console.log(`⏱️ 総処理時間: ${totalTime}ms`)
    
    return NextResponse.json({
      success: true,
      response: response,
      audio: audioData
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
} 