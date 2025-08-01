import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Google DriveのPDFファイルパス
    const filePath = '/Users/sakonhiroki/Library/CloudStorage/GoogleDrive-bestinksalesman@gmail.com/マイドライブ/KIRII/その他資料/Company Information.pdf';
    
    // ファイルが存在するかチェック
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDFファイルが見つかりません' });
    }

    // ファイルを読み込み
    const fileBuffer = fs.readFileSync(filePath);
    
    // PDFファイルとしてレスポンスを設定
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Company Information.pdf"');
    res.setHeader('Content-Length', fileBuffer.length);
    
    // ファイルを送信
    res.send(fileBuffer);
  } catch (error) {
    console.error('PDFダウンロードエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
} 