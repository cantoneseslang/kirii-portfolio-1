"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { FolderOpen, FileText, Download, RefreshCw, Upload, ChevronRight, ChevronDown } from "lucide-react"
import { downloadFile } from "@/lib/google-drive"

export default function CertificationPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folderId, setFolderId] = useState("1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It"); // 直接設定
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [folderStructure, setFolderStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // フォルダIDからフォルダ構造を取得
  const fetchFolderStructure = async () => {
    if (!folderId.trim()) {
      setError("フォルダIDが設定されていません");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/get-folder-contents?folderId=${encodeURIComponent(folderId)}`);
      const data = await response.json();

      if (data.success) {
        setFolderStructure(data);
      } else {
        setError(data.message || "フォルダ構造の取得に失敗しました");
      }
    } catch (error) {
      console.error("Error fetching folder structure:", error);
      setError("フォルダ構造の取得中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ページ読み込み時に自動的にフォルダ構造を取得
  useEffect(() => {
    if (folderId) {
      fetchFolderStructure();
    }
  }, []);

  // サブフォルダの内容を取得
  const fetchSubFolderContents = async (subFolderId: string, subFolderName: string) => {
    try {
      console.log(`Fetching contents for subfolder: ${subFolderName} (${subFolderId})`);
      const response = await fetch(`/api/get-folder-contents?folderId=${encodeURIComponent(subFolderId)}`);
      const data = await response.json();

      console.log(`Subfolder contents for ${subFolderName}:`, data);
      console.log(`Files in ${subFolderName}:`, data.files);
      console.log(`Folders in ${subFolderName}:`, data.folders);

      if (data.success) {
        // フォルダ構造を更新 - 再帰的に更新
        setFolderStructure(prev => {
          const updateFolderContents = (folders: any[]): any[] => {
            return folders.map(folder => {
              if (folder.id === subFolderId) {
                return { ...folder, contents: data };
              }
              // 再帰的に子フォルダも更新
              if (folder.contents && folder.contents.folders) {
                return {
                  ...folder,
                  contents: {
                    ...folder.contents,
                    folders: updateFolderContents(folder.contents.folders)
                  }
                };
              }
              return folder;
            });
          };

          return {
            ...prev,
            folders: updateFolderContents(prev.folders)
          };
        });
      } else {
        console.error(`Failed to fetch contents for ${subFolderName}:`, data.message);
      }
    } catch (error) {
      console.error("Error fetching subfolder contents:", error);
    }
  };

  // フォルダの展開/折りたたみ
  const toggleFolder = async (folderId: string, folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      // フォルダを展開するときに内容を取得
      await fetchSubFolderContents(folderId, folderName);
    }
    
    setExpandedFolders(newExpanded);
  };

  // ファイルを直接ダウンロード
  const handleDownloadFile = async (file: any) => {
    try {
      if (file.downloadUrl) {
        // 直接ダウンロードリンクを使用
        const link = document.createElement('a');
        link.href = file.downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // 従来の方法（ファイルIDを使用）
        await downloadFile(file.id, file.name);
      }
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
          await handleDownloadFile(file);
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
    if (!folderStructure) return null;
    
    // ルートファイルから検索
    for (const file of folderStructure.files || []) {
      if (file.id === fileId) return file;
    }
    
    // サブフォルダ内から検索
    for (const folder of folderStructure.folders || []) {
      if (folder.contents?.files) {
        for (const file of folder.contents.files) {
          if (file.id === fileId) return file;
        }
      }
    }
    
    return null;
  };

  // フォルダ構造を再帰的に表示
  const renderFolderStructure = (folders: any[], files: any[], level: number = 0) => {
    console.log(`Rendering level ${level}:`, { folders: folders.length, files: files.length });
    console.log(`Level ${level} folders:`, folders);
    console.log(`Level ${level} files:`, files);
    
    return (
      <div className="space-y-4">
        {/* フォルダの表示 */}
        {folders.map((folder) => (
          <div key={folder.id} className="border rounded-lg p-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => toggleFolder(folder.id, folder.name)}
            >
              <div className="flex items-center space-x-2">
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{folder.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {folder.contents ? `${folder.contents.files?.length || 0} files` : 'Click to expand'}
              </span>
            </div>
            
            {/* 展開されたフォルダの内容 */}
            {expandedFolders.has(folder.id) && folder.contents && (
              <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4">
                {console.log(`Rendering contents for ${folder.name}:`, folder.contents)}
                {renderFolderStructure(folder.contents.folders || [], folder.contents.files || [], level + 1)}
              </div>
            )}
          </div>
        ))}
        
        {/* ファイルの表示 */}
        {files.map((file) => (
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
              onClick={() => handleDownloadFile(file)}
              size="sm"
              className="bg-[#02315a] hover:bg-[#02315a]/90 text-white"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Certification"
        text="認證文件"
        center={true}
      />

      <div className="grid gap-6 mt-6">
        {/* ローディング表示 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <Card className="p-6">
            <div className="text-red-600 text-center">
              <p className="text-lg font-semibold">エラーが発生しました</p>
              <p className="text-sm mt-2">{error}</p>
              <Button
                onClick={fetchFolderStructure}
                className="mt-4 bg-[#02315a] hover:bg-[#02315a]/90 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            </div>
          </Card>
        )}

        {/* フォルダ構造表示 */}
        {folderStructure && (
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

            {/* フォルダ構造の表示 */}
            <Card>
              <CardContent className="pt-6">
                {renderFolderStructure(folderStructure.folders || [], folderStructure.files || [], 0)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 使用方法の説明 */}
        {!folderStructure && !isLoading && !error && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">認證文件</h3>
            <div className="space-y-3 text-sm">
              <p>Google Driveから認證文件を自動取得しています...</p>
              <p>フォルダをクリックして展開し、ファイルをダウンロードしてください。</p>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </DashboardShell>
  )
} 