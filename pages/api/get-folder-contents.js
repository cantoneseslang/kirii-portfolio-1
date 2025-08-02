const GOOGLE_DRIVE_API_KEY = 'AIzaSyAVhBDAR1knpgN_6ZnDKOy5HKVdqpm9_48';
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ message: 'Folder ID is required' });
  }

  try {
    // フォルダ内のファイルとサブフォルダを取得
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files?q='${folderId}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch folder contents from Google Drive');
    }

    const data = await response.json();
    const items = data.files || [];

    // フォルダとファイルを分類
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    res.json({
      success: true,
      folderId,
      folders: folders,
      files: files,
      totalItems: items.length
    });

  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch folder contents',
      error: error.message 
    });
  }
} 