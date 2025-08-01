const fs = require('fs');
const { PDFDocument, PDFForm, PDFTextField } = require('pdf-lib');

async function updateCompanyInfo() {
  try {
    // PDFファイルを読み込み
    const pdfBytes = fs.readFileSync('public/Company Information.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // フォームフィールドを取得
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('利用可能なフィールド:');
    fields.forEach(field => {
      console.log(`- ${field.getName()}: ${field.getValue()}`);
    });
    
    // 口座情報フィールドを探して更新
    // フィールド名は実際のPDFに合わせて調整が必要
    const accountFields = fields.filter(field => 
      field.getName().toLowerCase().includes('account') ||
      field.getName().toLowerCase().includes('hkd') ||
      field.getName().toLowerCase().includes('cny') ||
      field.getName().toLowerCase().includes('usd')
    );
    
    if (accountFields.length > 0) {
      console.log('口座情報フィールドが見つかりました:');
      accountFields.forEach(field => {
        console.log(`- ${field.getName()}: ${field.getValue()}`);
      });
    } else {
      console.log('口座情報フィールドが見つかりませんでした。');
    }
    
    // 更新されたPDFを保存
    const updatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync('public/Company Information Updated.pdf', updatedPdfBytes);
    
    console.log('PDFファイルの分析が完了しました。');
    console.log('更新されたファイル: public/Company Information Updated.pdf');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

updateCompanyInfo(); 