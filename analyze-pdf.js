const fs = require('fs');
const pdfParse = require('pdf-parse');

async function analyzePDF() {
  try {
    // PDFファイルを読み込み
    const dataBuffer = fs.readFileSync('public/Company Information.pdf');
    
    // PDFを解析
    const data = await pdfParse(dataBuffer);
    
    console.log('PDFの内容:');
    console.log('====================');
    console.log(data.text);
    console.log('====================');
    
    // 口座情報を探す
    const text = data.text.toLowerCase();
    if (text.includes('account number') || text.includes('hkd') || text.includes('cny') || text.includes('usd')) {
      console.log('\n口座情報が見つかりました！');
      
      // 元のテキストから口座情報部分を抽出
      const lines = data.text.split('\n');
      const accountLines = lines.filter(line => 
        line.toLowerCase().includes('account') ||
        line.toLowerCase().includes('hkd') ||
        line.toLowerCase().includes('cny') ||
        line.toLowerCase().includes('usd') ||
        line.toLowerCase().includes('9-051696') ||
        line.toLowerCase().includes('209545-838')
      );
      
      console.log('\n現在の口座情報:');
      accountLines.forEach(line => console.log(line));
      
    } else {
      console.log('\n口座情報が見つかりませんでした。');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

analyzePDF(); 