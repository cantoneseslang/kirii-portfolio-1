const GOOGLE_DRIVE_API_KEY = 'AIzaSyAVhBDAR1knpgN_6ZnDKOy5HKVdqpm9_48';

// Google Drive APIのベースURL
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// ファイルIDのマッピング（カテゴリー別）
export const FILE_MAPPINGS = {
  'Certificate List_Jan2025.xlsx': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'PVDF Aluminium Panel Specification 20190605_WM.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'Powder Coating Aluminium Panel Specification 20190709_WM.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'PPG Color Chart.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  // 他のファイルIDをここに追加
};

// カテゴリー別のファイルマッピング
export const CATEGORY_FILES = {
  'Powder Coating': [
    { name: 'Green Certificate.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
    { name: 'GB Standard.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
    { name: 'EN Standard.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
  ],
  'PVDF Coating': [
    { name: 'PVDF Certificate.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
  ],
  'Company Cert': [
    { name: 'ISO Certificate.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
    { name: 'Business Registration.pdf', id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
  ],
  // 他のカテゴリーをここに追加
};

// ファイルIDからダウンロードURLを生成
export function getFileDownloadUrl(fileId: string): string {
  return `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
}

// ファイル名からファイルIDを取得
export function getFileId(fileName: string): string | null {
  return FILE_MAPPINGS[fileName as keyof typeof FILE_MAPPINGS] || null;
}

// カテゴリー内のファイル一覧を取得
export function getCategoryFiles(categoryName: string) {
  return CATEGORY_FILES[categoryName as keyof typeof CATEGORY_FILES] || [];
}

// ファイルのメタデータを取得
export async function getFileMetadata(fileId: string) {
  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?key=${GOOGLE_DRIVE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch file metadata');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    throw error;
  }
}

// ファイルをダウンロード
export async function downloadFile(fileId: string, fileName: string) {
  try {
    const downloadUrl = getFileDownloadUrl(fileId);
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
} 