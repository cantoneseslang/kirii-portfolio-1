"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Download, Eye } from "lucide-react"
import Link from "next/link"

const pdfFiles = [
  {
    name: "Catalogue of Kirii 'Studco' steel stud drywall framing system.pdf",
    path: "/pdfs/metal-framing/Catalogue of Kirii 'Studco' steel stud drywall framing system.pdf"
  },
  {
    name: "Kirii HD-25 & SD-19 Ceiling Suspension System.pdf",
    path: "/pdfs/metal-framing/Kirii HD-25 & SD-19 Ceiling Suspension System.pdf"
  },
  {
    name: "Kirii HD-25 Ceiling Suspension System.pdf",
    path: "/pdfs/metal-framing/Kirii HD-25 Ceiling Suspension System.pdf"
  },
  {
    name: "Kirii Tee Grid Ceiling System.pdf",
    path: "/pdfs/metal-framing/Kirii Tee Grid Ceiling System.pdf"
  }
]

export default function MetalFramingPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="mb-6">
        <Link href="/product-manual">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Manual
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Metal Framing</h1>
        <p className="text-muted-foreground mt-2">Metal Framing產品資料</p>
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
                    <span>👁️ Preview</span>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 