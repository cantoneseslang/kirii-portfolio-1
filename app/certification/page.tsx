"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { FolderOpen, FileText, Download } from "lucide-react"
import { downloadFile, getFileId } from "@/lib/google-drive"

export default function CertificationPage() {
  const certificationCategories = [
    {
      name: "Powder Coating",
      nameZh: "粉末塗料",
      description: "Powder coating certifications and standards",
      descriptionZh: "粉末塗料認證及標準",
      subcategories: ["Green", "GB", "EN", "BS", "ASTM", "AS Standard", "JIS", "ISO", "French VOC", "CDPH", "BS EN ISO", "BS EN", "AAMA 2605", "Expired", "粉廠提供證書"]
    },
    {
      name: "PVDF Coating",
      nameZh: "PVDF塗料",
      description: "PVDF coating certifications",
      descriptionZh: "PVDF塗料認證",
      subcategories: []
    },
    {
      name: "Kirii HK",
      nameZh: "桐井香港",
      description: "Hong Kong company certifications",
      descriptionZh: "香港公司認證",
      subcategories: []
    },
    {
      name: "Tee Grid",
      nameZh: "T型網格",
      description: "Tee grid system certifications",
      descriptionZh: "T型網格系統認證",
      subcategories: []
    },
    {
      name: "Tai Shan 泰山",
      nameZh: "泰山",
      description: "Tai Shan product certifications",
      descriptionZh: "泰山產品認證",
      subcategories: []
    },
    {
      name: "Galvanized Steel Panel",
      nameZh: "鍍鋅鋼板",
      description: "Galvanized steel panel certifications",
      descriptionZh: "鍍鋅鋼板認證",
      subcategories: []
    },
    {
      name: "Ceiling System",
      nameZh: "天花板系統",
      description: "Ceiling system certifications",
      descriptionZh: "天花板系統認證",
      subcategories: []
    },
    {
      name: "Stainless Steel",
      nameZh: "不鏽鋼",
      description: "Stainless steel certifications",
      descriptionZh: "不鏽鋼認證",
      subcategories: []
    },
    {
      name: "Company Cert",
      nameZh: "公司認證",
      description: "Company certifications and registrations",
      descriptionZh: "公司認證及註冊",
      subcategories: ["Green Product", "ISO", "GB", "铁料recycle content", "碳足迹证书", "專利", "商業登記證", "GMC"]
    },
    {
      name: "Acoustic Material",
      nameZh: "吸音材料",
      description: "Acoustic material certifications",
      descriptionZh: "吸音材料認證",
      subcategories: []
    },
    {
      name: "Water Based Coating",
      nameZh: "水性塗料",
      description: "Water based coating certifications",
      descriptionZh: "水性塗料認證",
      subcategories: []
    },
    {
      name: "Gypsum Board, M2Tech & Cement Board",
      nameZh: "石膏板、M2Tech及水泥板",
      description: "Gypsum board and cement board certifications",
      descriptionZh: "石膏板及水泥板認證",
      subcategories: ["Fire", "STC & RW"]
    },
    {
      name: "KIRII Gypsum Board",
      nameZh: "桐井石膏板",
      description: "KIRII gypsum board certifications",
      descriptionZh: "桐井石膏板認證",
      subcategories: []
    },
    {
      name: "Mill Cert",
      nameZh: "工廠認證",
      description: "Mill certifications",
      descriptionZh: "工廠認證",
      subcategories: []
    },
    {
      name: "MK",
      nameZh: "MK",
      description: "MK product certifications",
      descriptionZh: "MK產品認證",
      subcategories: []
    },
    {
      name: "New Element 新元素",
      nameZh: "新元素",
      description: "New Element product certifications",
      descriptionZh: "新元素產品認證",
      subcategories: []
    },
    {
      name: "泰石Mineral Wool",
      nameZh: "泰石礦棉",
      description: "Mineral wool certifications",
      descriptionZh: "礦棉認證",
      subcategories: []
    },
    {
      name: "Standards - pdf for reference",
      nameZh: "標準參考文件",
      description: "Reference standards and documents",
      descriptionZh: "參考標準及文件",
      subcategories: []
    },
    {
      name: "Aluminium Panel without coating",
      nameZh: "無塗層鋁板",
      description: "Uncoated aluminium panel certifications",
      descriptionZh: "無塗層鋁板認證",
      subcategories: []
    },
    {
      name: "阿克蘇",
      nameZh: "阿克蘇",
      description: "AkzoNobel product certifications",
      descriptionZh: "阿克蘇產品認證",
      subcategories: []
    },
    {
      name: "水性噴塗",
      nameZh: "水性噴塗",
      description: "Water-based spraying certifications",
      descriptionZh: "水性噴塗認證",
      subcategories: []
    },
    {
      name: "Wooden Sticker",
      nameZh: "木質貼紙",
      description: "Wooden sticker certifications",
      descriptionZh: "木質貼紙認證",
      subcategories: []
    },
    {
      name: "Test Standard Info",
      nameZh: "測試標準資訊",
      description: "Test standard information",
      descriptionZh: "測試標準資訊",
      subcategories: []
    },
    {
      name: "Sum-PVDF Coating",
      nameZh: "Sum-PVDF塗料",
      description: "Sum-PVDF coating certifications",
      descriptionZh: "Sum-PVDF塗料認證",
      subcategories: []
    },
    {
      name: "Sum-Powder Coating",
      nameZh: "Sum-粉末塗料",
      description: "Sum-powder coating certifications",
      descriptionZh: "Sum-粉末塗料認證",
      subcategories: []
    },
    {
      name: "Soundex",
      nameZh: "Soundex",
      description: "Soundex product certifications",
      descriptionZh: "Soundex產品認證",
      subcategories: []
    },
    {
      name: "RED",
      nameZh: "RED",
      description: "RED product certifications",
      descriptionZh: "RED產品認證",
      subcategories: []
    },
    {
      name: "Metal",
      nameZh: "金屬",
      description: "Metal product certifications",
      descriptionZh: "金屬產品認證",
      subcategories: []
    },
    {
      name: "M6 Stud Bolt (M6 螺絲)",
      nameZh: "M6螺絲",
      description: "M6 stud bolt certifications",
      descriptionZh: "M6螺絲認證",
      subcategories: []
    },
    {
      name: "Cement Board",
      nameZh: "水泥板",
      description: "Cement board certifications",
      descriptionZh: "水泥板認證",
      subcategories: []
    }
  ];

  const handleDownloadCategory = (categoryName: string) => {
    console.log('View category files:', categoryName);
    // カテゴリー内のファイル一覧を表示（モーダルまたは新しいページ）
    alert(`Viewing files in category: ${categoryName}\n\nThis will show individual files for download.`);
  };

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleDownloadFile = async (fileName: string) => {
    console.log('Download file clicked:', fileName);
    try {
      const fileId = getFileId(fileName);
      if (!fileId) {
        alert(`File not found: ${fileName}`);
        return;
      }
      
      await downloadFile(fileId, fileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(file => file !== fileName)
        : [...prev, fileName]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to download');
      return;
    }
    
    console.log('Downloading selected files:', selectedFiles);
    
    try {
      // 複数ファイルのダウンロード処理
      for (const fileName of selectedFiles) {
        const fileId = getFileId(fileName);
        if (fileId) {
          await downloadFile(fileId, fileName);
        } else {
          console.warn(`File not found: ${fileName}`);
        }
      }
      
      setSelectedFiles([]);
    } catch (error) {
      console.error('Download error:', error);
      alert('Some downloads failed. Please try again.');
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Certification"
        text="認證文件"
        center={true}
      />

      <div className="grid gap-6 mt-6">
        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificationCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg font-semibold">
                      {category.name}
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => handleDownloadCategory(category.name)}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    <span>View Files</span>
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{category.nameZh}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-2">{category.description}</p>
                <p className="text-sm text-gray-600">{category.descriptionZh}</p>
                
                {/* Subcategories */}
                {category.subcategories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Subcategories / 子類別:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.subcategories.map((sub, subIndex) => (
                        <span
                          key={subIndex}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Files Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="h-6 w-6 text-green-600" />
                <span>Important Documents / 重要文件</span>
              </CardTitle>
              {selectedFiles.length > 0 && (
                <Button
                  onClick={handleDownloadSelected}
                  className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Selected ({selectedFiles.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes("Certificate List_Jan2025.xlsx")}
                      onChange={() => handleFileSelection("Certificate List_Jan2025.xlsx")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium">Certificate List_Jan2025.xlsx</p>
                      <p className="text-sm text-gray-600">認證清單</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile("Certificate List_Jan2025.xlsx")}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes("PVDF Aluminium Panel Specification 20190605_WM.pdf")}
                      onChange={() => handleFileSelection("PVDF Aluminium Panel Specification 20190605_WM.pdf")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium">PVDF Aluminium Panel Specification</p>
                      <p className="text-sm text-gray-600">PVDF鋁板規格</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile("PVDF Aluminium Panel Specification 20190605_WM.pdf")}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes("Powder Coating Aluminium Panel Specification 20190709_WM.pdf")}
                      onChange={() => handleFileSelection("Powder Coating Aluminium Panel Specification 20190709_WM.pdf")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium">Powder Coating Aluminium Panel Specification</p>
                      <p className="text-sm text-gray-600">粉末塗料鋁板規格</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile("Powder Coating Aluminium Panel Specification 20190709_WM.pdf")}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes("PPG Color Chart.pdf")}
                      onChange={() => handleFileSelection("PPG Color Chart.pdf")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium">PPG Color Chart.pdf</p>
                      <p className="text-sm text-gray-600">PPG色卡</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile("PPG Color Chart.pdf")}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white px-4 py-2 text-sm border border-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </DashboardShell>
  )
} 