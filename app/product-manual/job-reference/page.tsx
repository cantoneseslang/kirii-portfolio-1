"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Download } from "lucide-react"
import Link from "next/link"

const pdfFiles = [
  {
    name: "Job reference - Gyproc gypsum boards (1).pdf",
    path: "/pdfs/job-reference/Job reference - Gyproc gypsum boards (1).pdf"
  },
  {
    name: "Job Reference - James Hardie fibre cement boards.pdf",
    path: "/pdfs/job-reference/Job Reference - James Hardie fibre cement boards.pdf"
  },
  {
    name: "Job Reference - James Hardie Villaboard fibre cement boards.pdf",
    path: "/pdfs/job-reference/Job Reference - James Hardie Villaboard fibre cement boards.pdf"
  },
  {
    name: "Job Reference_Kirii 'Studco' steel stud partition framing system.pdf",
    path: "/pdfs/job-reference/Job Reference_Kirii 'Studco' steel stud partition framing system.pdf"
  }
]

export default function JobReferencePage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/product-manual">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Manual
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Job Reference</h1>
        <p className="text-muted-foreground mt-2">工事参考資料</p>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 