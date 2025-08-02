export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { category, filename } = req.query;

  try {
    // 一時的な実装：ファイルが見つからない場合のエラーレスポンス
    res.status(404).json({ 
      message: 'File not found',
      info: 'This endpoint will be implemented with Google Drive API integration',
      requested: { category, filename }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error occurred' });
  }
} 