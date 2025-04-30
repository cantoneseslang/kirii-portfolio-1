// DeepSeek API プロキシエンドポイント
// このファイルはCORSエラーを回避するために、フロントエンドからのリクエストをDeepSeek APIに転送します

// キャッシュ用のMap
const responseCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1時間のキャッシュ

export default async function handler(req, res) {
  // POSTリクエストのみを許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    const apiUrl = 'https://api.deepseek.com';

    // キャッシュキーの生成
    const cacheKey = JSON.stringify(req.body);
    
    // キャッシュのチェック（ストリーミングでない場合のみ）
    if (!req.body.stream) {
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_TTL) {
        console.log('Returning cached response');
        return res.status(200).json(cachedResponse.data);
      }
    }

    // ストリーミングの設定
    if (req.body.stream) {
      // ストリーミングレスポンスの設定
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
        res.end();
        return;
      }

      // ストリーミングレスポンスを転送
      const reader = response.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            res.write('data: [DONE]\n\n');
            break;
          }
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            // データラインをそのまま転送
            res.write(`${line}\n`);
            
            // 明示的にフラッシュ
            if (res.flush) {
              res.flush();
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming error occurred' })}\n\n`);
      } finally {
        res.end();
      }
      return;
    }

    // 通常のリクエスト処理
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      return res.status(500).json({ 
        error: 'Invalid JSON response from DeepSeek API', 
        rawResponse: responseText.substring(0, 200)
      });
    }
    
    if (!response.ok) {
      console.error('DeepSeek API error status:', response.status);
      console.error('DeepSeek API error body:', data);
      return res.status(response.status).json(data);
    }

    // キャッシュに保存（ストリーミングでない場合のみ）
    responseCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to DeepSeek API:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to DeepSeek API',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
