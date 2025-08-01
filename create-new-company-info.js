const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createNewCompanyInfo() {
  try {
    // 新しいPDFドキュメントを作成
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4サイズ
    
    // フォントを埋め込み
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    
    let y = 800; // 開始位置
    
    // テキストを描画
    const drawText = (text, x, yPos, size = fontSize) => {
      page.drawText(text, {
        x,
        y: yPos,
        size,
        font,
        color: rgb(0, 0, 0)
      });
      return yPos - lineHeight;
    };
    
    // タイトル
    y = drawText('Company Information', 50, y, 18);
    y -= 20;
    
    // 香港桐井有限公司情報
    y = drawText('公司註冊證書號碼: 184499', 50, y);
    y = drawText('商業登記證號(BR): 10955344', 50, y);
    y = drawText('設立日期: 1987年5月', 50, y);
    y -= 10;
    
    y = drawText('「公司註冊證書」包含「公司註冊號碼」(CRN)，即左上⻆的7位數字。', 50, y);
    y = drawText('公司註冊名稱、商業登記號碼和公司註冊號碼都是公司的重要標識。', 50, y);
    y = drawText('商業登記證號碼格式為XXXXXXXX-&&&-&&-&&-&，首8位數字就是商業登記號碼', 50, y);
    y -= 20;
    
    y = drawText('香港桐井有限公司', 50, y, 14);
    y = drawText('地址: 香港大埔大埔工業村大富街9號', 50, y);
    y = drawText('電話:(852)2797 2026', 50, y);
    y = drawText('傳真:(852)2341 2618', 50, y);
    y = drawText('翕站: https://www.kirii.com.hk', 50, y);
    y -= 20;
    
    y = drawText('KIRII (Hong Kong) Limited', 50, y, 14);
    y = drawText('Address:No.9 Dai Fu Street,Tai Po Industrial Estate,Tai Po, New Territories,', 50, y);
    y = drawText('Hong Kong', 50, y);
    y = drawText('Tel:(852)27972026', 50, y);
    y = drawText('Fax:(852)23412618', 50, y);
    y = drawText('Web: https://www.kirii.com.hk', 50, y);
    y -= 20;
    
    // 銀行情報
    y = drawText('Bank Information', 50, y, 14);
    y = drawText('Bank : The Hongkong and Shanghai Banking Corporation Limited', 50, y);
    y = drawText('Head Office branch address: 1/Fl., Causeway Bay Plaza, Phase 2, 463-483 Lockhart Road,', 50, y);
    y = drawText('Causeway Bay, Hong Kong', 50, y);
    y = drawText('Bank code: 004', 50, y);
    y = drawText('SWIFT code: HSBCHKHHHKH', 50, y);
    y = drawText('Branch code: 025', 50, y);
    y = drawText('Account Number:', 50, y);
    y -= 10;
    
    // 更新された口座情報
    y = drawText('港幣帳戶', 70, y);
    y = drawText('(HKD) 9-051696', 70, y);
    y = drawText('外幣帳戶 (CNY) 209545-838', 70, y);
    y = drawText('(USD) 209545-838', 70, y);
    y = drawText('(SGD) 209545-838', 70, y);
    y -= 20;
    
    // 佛山市三水桐井建筑材料有限公司情報
    y = drawText('佛山市三水桐井建筑材料有限公司', 50, y, 14);
    y = drawText('统一社会信用代码: 914406007879338236', 50, y);
    y = drawText('成立日期:2006年4月30日', 50, y);
    y = drawText('邮区编号: 528100', 50, y);
    y = drawText('地址: 中国广东佛山市三水区云东海街道永业路13号', 50, y);
    y = drawText('电话: (86) 757-8782 6438,(86) 757-8782 3315', 50, y);
    y = drawText('传真: (86) 757-8782 6330', 50, y);
    y = drawText('网站: https://kirii.cn', 50, y);
    y -= 20;
    
    y = drawText('Kirii Sanshui Building Materials Fty. Ltd.', 50, y, 14);
    y = drawText('Post-code 528100', 50, y);
    y = drawText('No. 13 Yongye Road, Yundonghai Street, Sanshui, Foshan, Guangdong, China', 50, y);
    y = drawText('Phone: (86) 757-8782 6438,(86)757-8782-3315', 50, y);
    y = drawText('Fax:(86)757-8787-6330', 50, y);
    y = drawText('Web: https://kirii.cn', 50, y);
    
    // PDFを保存
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('public/Company Information Updated.pdf', pdfBytes);
    
    console.log('新しいCompany Information PDFを作成しました！');
    console.log('ファイル: public/Company Information Updated.pdf');
    console.log('\n更新された口座情報:');
    console.log('港幣帳戶');
    console.log('(HKD) 9-051696');
    console.log('外幣帳戶 (CNY) 209545-838');
    console.log('(USD) 209545-838');
    console.log('(SGD) 209545-838');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

createNewCompanyInfo(); 