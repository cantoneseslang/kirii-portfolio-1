import { getFileId, getCategoryFiles, getFileDownloadUrl } from '@/lib/google-drive';

export default function handler(req, res) {
  console.log('API called with query:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { category, filename } = req.query;

  try {
    console.log('Processing request for:', { category, filename });
    
    if (filename) {
      // 個別ファイルのダウンロード
      const fileId = getFileId(filename);
      if (!fileId) {
        return res.status(404).json({ 
          message: 'File not found',
          requested: { filename }
        });
      }
      
      const downloadUrl = getFileDownloadUrl(fileId);
      res.redirect(downloadUrl);
    } else if (category) {
      // カテゴリー内のファイル一覧を返す
      const files = getCategoryFiles(category);
      res.json({ 
        category,
        files,
        message: 'Category files retrieved successfully'
      });
    } else {
      res.status(400).json({ message: 'Either filename or category must be provided' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error occurred' });
  }
} 