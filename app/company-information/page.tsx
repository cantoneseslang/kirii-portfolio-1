"use client"

import Image from "next/image"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

const CN_ISO_9001_PDF = "/company-information/cc1420-cn-en-2026-0428-2029-0427.pdf"
const JAPAN_HEADQUARTERS_SOGO_PDF =
  "/company-information/sogo-ver202604-20260401093310.pdf"
const JAPAN_HEADQUARTERS_SOGO_FILENAME =
  "sogo_ver202604_20260401093310.pdf"
const HONG_KONG_BR_PDF = "/company-information/download-br.pdf"
const HONG_KONG_BR_FILENAME = "Download BR.pdf"

const cnIsoPreviewPages = [
  {
    src: "/company-information/iso-9001-2015-cn-thumb.png",
    alt: "ISO 9001:2015 Chinese certificate preview",
    label: "Chinese certificate preview",
  },
  {
    src: "/company-information/iso-9001-2015-en-thumb.png",
    alt: "ISO 9001:2015 English certificate preview",
    label: "English certificate preview",
  },
]

export default function CompanyInformationPage() {
  const handleDownloadPDF = (type: "general" | "hk" | "cn") => {
    let filePath = '';
    let filename = '';
    
    switch(type) {
      case 'general':
        filePath = '/Company Information.pdf';
        filename = 'Company Information.pdf';
        break;
      case 'hk':
        filePath = '/Company Information-HK.pdf';
        filename = 'Company Information-HK.pdf';
        break;
      case 'cn':
        filePath = '/Company Information-CN.pdf';
        filename = 'Company Information-CN.pdf';
        break;
      default:
        return;
    }
    
    // シンプルなファイルダウンロード
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Company Information"
        text="公司信息"
        center={true}
      />

      <div className="grid gap-6 mt-6">
        {/* Japan headquarters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              株式会社桐井製作所（日本本社）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">基本信息 / Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>設立年月日:</strong> 1964年3月21日
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">聯絡信息 / Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Address:</strong> Gran Tokyo South Tower 5F, 1-9-2 Marunouchi,
                    Chiyoda-ku, Tokyo
                    <br />
                    100-6605 JAPAN
                  </p>
                  <p>
                    <strong>TEL:</strong> 03-4345-6000
                  </p>
                  <p>
                    <strong>FAX:</strong> 03-6895-0200
                  </p>
                  <p>
                    <strong>Web:</strong>{" "}
                    <a
                      href="https://www.kirii.co.jp/"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://www.kirii.co.jp/
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <Button
              asChild
              className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
            >
              <a
                href={JAPAN_HEADQUARTERS_SOGO_PDF}
                download={JAPAN_HEADQUARTERS_SOGO_FILENAME}
              >
                📄 Download PDF
              </a>
            </Button>
          </CardContent>
        </Card>

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
            <Button
              asChild
              className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
            >
              <a href={HONG_KONG_BR_PDF} download={HONG_KONG_BR_FILENAME}>
                📄 Download BR PDF
              </a>
            </Button>
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

            <div className="border-t pt-6">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">ISO 9001:2015</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>生效日期/Effective Date 2026-04-28</p>
                  <p>有效限期/Expiry Date 2029-04-27</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {cnIsoPreviewPages.map((preview) => (
                  <a
                    key={preview.src}
                    href={CN_ISO_9001_PDF}
                    download="CC1420-CN-EN-2026-0428-2029-0427.pdf"
                    className="group rounded-lg border bg-background p-3 transition-colors hover:border-[#02315a]/40"
                  >
                    <div className="overflow-hidden rounded-md border bg-white">
                      <Image
                        src={preview.src}
                        alt={preview.alt}
                        width={320}
                        height={453}
                        className="h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#02315a]">
                      {preview.label}
                    </p>
                  </a>
                ))}
              </div>

              <Button
                asChild
                className="mt-4 bg-[#02315a] hover:bg-[#02315a]/90 text-white px-6 py-3 text-base border border-white"
              >
                <a
                  href={CN_ISO_9001_PDF}
                  download="CC1420-CN-EN-2026-0428-2029-0427.pdf"
                >
                  📄 Download ISO 9001:2015 PDF
                </a>
              </Button>
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