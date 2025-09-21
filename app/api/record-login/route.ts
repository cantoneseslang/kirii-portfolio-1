import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, success, errorMessage, ipAddress, userAgent } = await request.json()

    console.log('=== API Route Debug ===')
    console.log('Received data:', { userId, success, errorMessage, ipAddress, userAgent })

    // 実際のIPアドレスを取得
    const realIpAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         ipAddress || 
                         'unknown'

    console.log('Real IP address:', realIpAddress)

    // Service Roleクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Service Role client created')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // ログイン履歴を記録
    const insertData = {
      user_id: userId,
      ip_address: realIpAddress,
      user_agent: userAgent,
      login_success: success,
      error_message: errorMessage || null,
      page_accessed: '/dashboard'
    }

    console.log('Inserting data:', insertData)

    const { data, error } = await supabase.from('login_history').insert(insertData)

    if (error) {
      console.error('Failed to record login history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Login history recorded successfully:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
