"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Download, Eye, Share2 } from "lucide-react"
import Link from "next/link"

const pdfFiles = [
  {
    name: "Catalogue of HardiWall solid wall systems.pdf",
    path: "/pdfs/james-hardie/Catalogue of HardiWall solid wall systems.pdf"
  },
  {
    name: "Catalogue of James Hardie 'Hardieflex' fibre cement board (wet areas).pdf",
    path: "/pdfs/james-hardie/Catalogue of James Hardie 'Hardieflex' fibre cement board (wet areas).pdf"
  },
  {
    name: "HardiWall System Specification V2.pdf",
    path: "/pdfs/james-hardie/HardiWall System Specification V2.pdf"
  },
  {
    name: "James Hardie HardiFlex.pdf",
    path: "/pdfs/james-hardie/James Hardie HardiFlex.pdf"
  },
  {
    name: "Villaboard Ceilings.pdf",
    path: "/pdfs/james-hardie/Villaboard Ceilings.pdf"
  },
  {
    name: "Villaboard Drywall.pdf",
    path: "/pdfs/james-hardie/Villaboard Drywall.pdf"
  }
]

export default function JamesHardiePage() {
  const handleShare = async (file: { name: string; path: string }) => {
    // Web Share APIが利用可能かチェック
    if (navigator.share) {
      try {
        // ファイルのURLを構築
        const fileUrl = `${window.location.origin}${file.path}`;
        
        await navigator.share({
          title: file.name,
          text: `KIRII Product Manual: ${file.name}`,
          url: fileUrl,
        });
      } catch (error) {
        console.log('共有がキャンセルされました:', error);
      }
    } else {
      // Web Share APIが利用できない場合は、URLをクリップボードにコピー
      const fileUrl = `${window.location.origin}${file.path}`;
      try {
        await navigator.clipboard.writeText(fileUrl);
        alert('ファイルのURLをクリップボードにコピーしました');
      } catch (error) {
        // フォールバック: 古いブラウザ用
        const textArea = document.createElement('textarea');
        textArea.value = fileUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('ファイルのURLをクリップボードにコピーしました');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="mb-6">
        <Link href="/product-manual">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Manual
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">James Hardie</h1>
        <p className="text-muted-foreground mt-2">James Hardie產品資料</p>
      </div>

      <div className="grid gap-4">
        {pdfFiles.map((file, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{file.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center space-x-2"
                    onClick={() => {
                      window.open(file.path, '_blank');
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                  <Button 
                    className="bg-[#02315a] text-white hover:bg-[#02315a] px-4 py-2 rounded-lg flex items-center space-x-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.path;
                      link.download = file.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <span>📄 Download PDF</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center space-x-2"
                    onClick={() => handleShare(file)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 