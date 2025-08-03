export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  try {
    console.log('Testing MiniMax API with text:', text);

    const requestBody = {
      model: 't2a_large_v2',
      text: text,
      voice_id: 'male-qn-qingse',
      config: {
        audio_format: 'mp3',
        sample_rate: 24000
      }
    };

    console.log('MiniMax API Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.minimax.chat/v1/text/t2a_large_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJIIFNha29uIiwiVXNlck5hbWUiOiJIIFNha29uIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4NjIwNjE3MzAxMDQ4NzM2NDYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxODYyMDYxNzMwMDk2NDg1MDM4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiYmVzdGlua3NhbGVzbWFuQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA4LTAzIDExOjQ3OjQ1IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.vmhReBjcWOP5_DZCbja84erd65ubW2h158ZIxahH8TfUdDEA0sawk2rlCoXYdfBtDAqMxwdYLwOx_SglRFTJhyqjDvimeMJ4TNHQYiwBj6aD-xuTrJoesWq7az8_7h4FkyKk15T2-pk2S-Fn4GZvk8DVC6tZrbVFR4QYo3R9rIMw8aNfCBHXpL5L0iGfvEeyf6K0kyLNLnSzVdA2y4d9TAczB3DZWeJtqqzYTZhGajmPDBCyjYZCvfMzP06z2DiBj-iIKueh_cQQ_7sIBxcoBHJvoL7zrwR068GAVqWQnG5O-Jvpuk8-dXloy1cFF67s_xMfEfzmq6MTUkEthfqtFA`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('MiniMax API Response Status:', response.status);
    console.log('MiniMax API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API Error Response:', errorText);
      return res.status(response.status).json({ 
        error: `MiniMax API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('MiniMax API Response Data:', JSON.stringify(data, null, 2));

    // レスポンス構造を確認
    let audioData = null;
    if (data.audio) {
      audioData = data.audio;
    } else if (data.choices && data.choices[0] && data.choices[0].audio) {
      audioData = data.choices[0].audio;
    } else if (data.data && data.data.audio) {
      audioData = data.data.audio;
    }

    if (audioData) {
      console.log('Audio data found, length:', audioData.length);
      console.log('Audio data preview:', audioData.substring(0, 100));
    } else {
      console.error('No audio data found in response');
    }

    return res.status(200).json({
      success: true,
      data: data,
      audioFound: !!audioData,
      audioLength: audioData ? audioData.length : 0
    });

  } catch (error) {
    console.error('Test MiniMax API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
} 