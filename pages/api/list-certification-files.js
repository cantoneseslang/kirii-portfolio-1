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
    // フォルダ内のファイル一覧を取得
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files?q='${folderId}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch files from Google Drive');
    }

    const data = await response.json();
    const files = data.files || [];

    // ファイルをカテゴリー別に分類
    const categorizedFiles = categorizeFiles(files);

    res.json({
      success: true,
      folderId,
      totalFiles: files.length,
      files: categorizedFiles
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch files',
      error: error.message 
    });
  }
}

// ファイルをカテゴリー別に分類する関数
function categorizeFiles(files) {
  const categories = {
    'Powder Coating': [],
    'PVDF Coating': [],
    'Company Cert': [],
    'Other': []
  };

  files.forEach(file => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('powder') || fileName.includes('green') || fileName.includes('gb') || fileName.includes('en') || fileName.includes('bs') || fileName.includes('astm') || fileName.includes('iso')) {
      categories['Powder Coating'].push(file);
    } else if (fileName.includes('pvdf') || fileName.includes('pvdf')) {
      categories['PVDF Coating'].push(file);
    } else if (fileName.includes('iso') || fileName.includes('business') || fileName.includes('registration') || fileName.includes('company')) {
      categories['Company Cert'].push(file);
    } else {
      categories['Other'].push(file);
    }
  });

  return categories;
} 