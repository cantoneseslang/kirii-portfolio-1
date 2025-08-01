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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height={16} width={16} className="text-white">
                    <path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4V12L16.5 9.5C16.9 9.1 17.5 9.1 17.9 9.5C18.3 9.9 18.3 10.5 17.9 10.9L12.7 16.1C12.3 16.5 11.7 16.5 11.3 16.1L6.1 10.9C5.7 10.5 5.7 9.9 6.1 9.5C6.5 9.1 7.1 9.1 7.5 9.5L10 12V4C10 2.9 10.9 2 12 2Z"/>
                    <path fill="currentColor" d="M20 20H4C3.4 20 3 20.4 3 21C3 21.6 3.4 22 4 22H20C20.6 22 21 21.6 21 21C21 20.4 20.6 20 20 20Z"/>
                  </svg>
                  <span>Download {file.name.replace('.pdf', '')} PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 