"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

export default function CompanyInformationPage() {
  const handleDownloadPDF = (type) => {
    let apiEndpoint = '';
    let filename = '';
    
    switch(type) {
      case 'general':
        apiEndpoint = '/api/download-pdf';
        filename = 'Company Information.pdf';
        break;
      case 'hk':
        apiEndpoint = '/api/download-pdf-hk';
        filename = 'Company Information-HK.pdf';
        break;
      case 'cn':
        apiEndpoint = '/api/download-pdf-cn';
        filename = 'Company Information-CN.pdf';
        break;
      default:
        return;
    }
    
    fetch(apiEndpoint)
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('PDFファイルのダウンロードに失敗しました');
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('ダウンロードエラー:', error);
        alert('PDFファイルのダウンロードに失敗しました');
      });
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Company Information"
        text="公司信息"
        center={true}
      />

      <div className="grid gap-6 mt-6">
        {/* Hong Kong Company */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">香港桐井有限公司 / KIRII (Hong Kong) Limited</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">基本信息 / Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>公司註冊證書號碼:</strong> 184499</p>
                  <p><strong>商業登記證號(BR):</strong> 10955344</p>
                  <p><strong>設立日期:</strong> 1987年5月</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">聯絡信息 / Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>地址:</strong> 香港大埔大埔工業村大富街9號</p>
                  <p><strong>Address:</strong> No. 9 Dai Fu Street, Tai Po Industrial Estate, Tai Po, New Territories, Hong Kong</p>
                  <p><strong>電話/Tel:</strong> (852) 2797 2026</p>
                  <p><strong>傳真/Fax:</strong> (852) 2341 2618</p>
                  <p><strong>網站/Web:</strong> <a href="https://www.kirii.com.hk" className="text-blue-600 hover:underline">https://www.kirii.com.hk</a></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Bank Information / 銀行信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <p><strong>Bank:</strong> The Hongkong and Shanghai Banking Corporation Limited</p>
                <p><strong>Head Office branch address:</strong> 1/Fl., Causeway Bay Plaza, Phase 2, 463-483 Lockhart Road, Causeway Bay, Hong Kong</p>
                <p><strong>Bank code:</strong> 004</p>
                <p><strong>SWIFT code:</strong> HSBCHKHHHKH</p>
                <p><strong>Branch code:</strong> 025</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>港幣帳戶</strong></p>
                <p>(HKD) 9-051696</p>
                <p><strong>外幣帳戶</strong></p>
                <p>(CNY) 209545-838</p>
                <p>(USD) 209545-838</p>
                <p>(SGD) 209545-838</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* China Company */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">佛山市三水桐井建筑材料有限公司 / Kirii Sanshui Building Materials Fty. Ltd.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">基本信息 / Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>统一社会信用代码:</strong> 914406007879338236</p>
                  <p><strong>成立日期:</strong> 2006年4月30日</p>
                  <p><strong>邮区编号/Post-code:</strong> 528100</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">聯絡信息 / Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>地址:</strong> 中国广东佛山市三水区云东海街道永业路13号</p>
                  <p><strong>Address:</strong> No. 13 Yongye Road, Yundonghai Street, Sanshui, Foshan, Guangdong, China</p>
                  <p><strong>电话/Phone:</strong> (86) 757-8782 6438, (86) 757-8782 3315</p>
                  <p><strong>传真/Fax:</strong> (86) 757-8782 6330</p>
                  <p><strong>网站/Web:</strong> <a href="https://kirii.cn" className="text-blue-600 hover:underline">https://kirii.cn</a></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">重要說明 / Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>「公司註冊證書」包含「公司註冊號碼」(CRN)，即左上角的7位數字。</p>
              <p>公司註冊名稱、商業登記號碼和公司註冊號碼都是公司的重要標識。</p>
              <p>商業登記證號碼格式為XXXXXXXX-&&&-&&-&&-&，首8位數字就是商業登記號碼。</p>
            </div>
          </CardContent>
        </Card>

        {/* Download PDF Buttons */}
        <div className="flex justify-center mt-6 gap-4 flex-wrap">
          <Button 
            onClick={() => handleDownloadPDF('general')}
            className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
          >
            📄 Download Company Information PDF
          </Button>
          <Button 
            onClick={() => handleDownloadPDF('hk')}
            className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
          >
            📄 Download HK-Company Information PDF
          </Button>
          <Button 
            onClick={() => handleDownloadPDF('cn')}
            className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
          >
            📄 Download CN-Company Information PDF
          </Button>
        </div>
      </div>
      
      <Footer />
    </DashboardShell>
  )
} 