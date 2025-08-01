const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');

async function updatePDFAccounts() {
  try {
    // PDFファイルを読み込み
    const pdfBytes = fs.readFileSync('public/Company Information.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 新しいPDFドキュメントを作成
    const newPdfDoc = await PDFDocument.create();
    
    // 元のPDFのページをコピー
    const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => newPdfDoc.addPage(page));
    
    // テキストを置換するために、PDFをテキストとして読み込み
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync('public/Company Information.pdf');
    const data = await pdfParse(dataBuffer);
    
    // 口座情報を置換
    let updatedText = data.text;
    
    // 元の口座情報パターンを探して置換
    const oldPattern = /Account Number:\s*\n\(HKD\)\s*9-051696\s*\n\(CNY\)\s*209545-838\s*\n\(USD\)\s*209545-838\s*\n\(SGD\)\s*209545-838/;
    const newText = `港幣帳戶 \n(HKD) 9-051696\n外幣帳戶 (CNY) 209545-838\n(USD) 209545-838\n(SGD) 209545-838`;
    
    if (oldPattern.test(updatedText)) {
      updatedText = updatedText.replace(oldPattern, newText);
      console.log('口座情報を更新しました！');
    } else {
      console.log('置換パターンが見つかりませんでした。');
      console.log('現在のテキスト:', data.text);
    }
    
    // 更新されたPDFを保存
    const updatedPdfBytes = await newPdfDoc.save();
    fs.writeFileSync('public/Company Information Updated.pdf', updatedPdfBytes);
    
    console.log('更新されたPDFファイルを保存しました: public/Company Information Updated.pdf');
    
    // 更新内容を確認
    console.log('\n更新された口座情報:');
    console.log(newText);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

updatePDFAccounts(); 