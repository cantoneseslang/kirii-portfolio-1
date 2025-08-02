// Google DriveのファイルIDを取得するためのヘルパー関数

// ファイルIDを取得する方法：
// 1. Google Driveでファイルを開く
// 2. URLからファイルIDを抽出
// 例：https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view
// ファイルID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

// フォルダIDを取得する方法：
// 1. Google Driveでフォルダを開く
// 2. URLからフォルダIDを抽出
// 例：https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
// フォルダID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

// 実際のファイルIDをここに設定してください
const ACTUAL_FILE_IDS = {
  // 重要ファイル
  'Certificate List_Jan2025.xlsx': 'YOUR_ACTUAL_FILE_ID',
  'PVDF Aluminium Panel Specification 20190605_WM.pdf': 'YOUR_ACTUAL_FILE_ID',
  'Powder Coating Aluminium Panel Specification 20190709_WM.pdf': 'YOUR_ACTUAL_FILE_ID',
  'PPG Color Chart.pdf': 'YOUR_ACTUAL_FILE_ID',
  
  // Powder Coating カテゴリー
  'Green Certificate.pdf': 'YOUR_ACTUAL_FILE_ID',
  'GB Standard.pdf': 'YOUR_ACTUAL_FILE_ID',
  'EN Standard.pdf': 'YOUR_ACTUAL_FILE_ID',
  
  // PVDF Coating カテゴリー
  'PVDF Certificate.pdf': 'YOUR_ACTUAL_FILE_ID',
  
  // Company Cert カテゴリー
  'ISO Certificate.pdf': 'YOUR_ACTUAL_FILE_ID',
  'Business Registration.pdf': 'YOUR_ACTUAL_FILE_ID',
};

// フォルダID
const CERTIFICATE_FOLDER_ID = 'YOUR_ACTUAL_FOLDER_ID';

console.log('=== Google Drive File IDs ===');
console.log('Certificate Folder ID:', CERTIFICATE_FOLDER_ID);
console.log('File IDs:', ACTUAL_FILE_IDS);

module.exports = {
  ACTUAL_FILE_IDS,
  CERTIFICATE_FOLDER_ID
}; 