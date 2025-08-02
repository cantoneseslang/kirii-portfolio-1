"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { FolderOpen, FileText, Download, RefreshCw, Upload } from "lucide-react"
import { downloadFile } from "@/lib/google-drive"

export default function CertificationPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folderId, setFolderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");
  const [showFileInput, setShowFileInput] = useState(false);

  // フォルダIDからファイル一覧を取得
  const fetchFiles = async () => {
    if (!folderId.trim()) {
      setError("フォルダIDを入力してください");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/list-certification-files?folderId=${encodeURIComponent(folderId)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setShowFileInput(false);
      } else {
        setError(data.message || "ファイルの取得に失敗しました");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("ファイルの取得中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルを直接ダウンロード
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to download');
      return;
    }
    
    try {
      // 選択されたファイルをダウンロード
      for (const fileId of selectedFiles) {
        const file = findFileById(fileId);
        if (file) {
          await downloadFile(fileId, file.name);
        }
      }
      
      setSelectedFiles([]);
    } catch (error) {
      console.error('Download error:', error);
      alert('Some downloads failed. Please try again.');
    }
  };

  // ファイルIDからファイルオブジェクトを検索
  const findFileById = (fileId: string) => {
    if (!files) return null;
    
    for (const category of Object.values(files)) {
      const file = category.find((f: any) => f.id === fileId);
      if (file) return file;
    }
    return null;
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Certification"
        text="認證文件"
        center={true}
      />

      <div className="grid gap-6 mt-6">
        {/* フォルダID入力セクション */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Google Drive フォルダからファイルを取得</h3>
            <Button
              onClick={() => setShowFileInput(!showFileInput)}
              variant="outline"
              className="bg-[#02315a] hover:bg-[#02315a]/90 text-white border-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showFileInput ? "閉じる" : "フォルダIDを入力"}
            </Button>
          </div>

          {showFileInput && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  フォルダID (Google DriveのフォルダURLから取得)
                </label>
                <input
                  type="text"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="例: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Google Driveでフォルダを開き、URLの「folders/」の後の文字列をコピーしてください
                </p>
              </div>
              
              <Button
                onClick={fetchFiles}
                disabled={isLoading || !folderId.trim()}
                className="bg-[#02315a] hover:bg-[#02315a]/90 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    取得中...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    ファイル一覧を取得
                  </>
                )}
              </Button>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
            </div>
          )}
        </Card>

        {/* ファイル一覧表示 */}
        {files && (
          <div className="space-y-6">
            {/* 選択されたファイルのダウンロードボタン */}
            {selectedFiles.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span>選択されたファイル: {selectedFiles.length}個</span>
                  <Button
                    onClick={handleDownloadSelected}
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    選択したファイルをダウンロード
                  </Button>
                </div>
              </Card>
            )}

            {/* カテゴリー別ファイル表示 */}
            {Object.entries(files).map(([categoryName, categoryFiles]: [string, any]) => (
              categoryFiles.length > 0 && (
                <Card key={categoryName}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
                      {categoryName} ({categoryFiles.length}個のファイル)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryFiles.map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleFileSelection(file.id)}
                              className="h-4 w-4"
                            />
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'サイズ不明'}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDownloadFile(file.id, file.name)}
                            size="sm"
                            className="bg-[#02315a] hover:bg-[#02315a]/90 text-white"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}

        {/* 使用方法の説明 */}
        {!files && !showFileInput && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">使用方法</h3>
            <div className="space-y-3 text-sm">
              <p>1. 「フォルダIDを入力」ボタンをクリック</p>
              <p>2. Google DriveでCertificateフォルダを開く</p>
              <p>3. URLからフォルダIDをコピー（例：https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms）</p>
              <p>4. 「1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms」の部分を入力</p>
              <p>5. 「ファイル一覧を取得」ボタンをクリック</p>
              <p>6. カテゴリー別に分類されたファイルが表示されます</p>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </DashboardShell>
  )
} 