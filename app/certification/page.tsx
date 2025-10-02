"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, FileText, Download, RefreshCw, ChevronRight, ChevronDown, Eye, Share2 } from "lucide-react"
import { downloadFile } from "@/lib/google-drive"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"

export default function CertificationPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folderId, setFolderId] = useState("1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It"); // 直接設定
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [folderStructure, setFolderStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; fileId: string; fileName: string }>({
    isOpen: false,
    fileId: "",
    fileName: ""
  });

  // 静的なファイル構造を設定
  const loadStaticFolderStructure = () => {
    setIsLoading(true);
    setError("");

    try {
      // 静的なファイル構造を設定
      const staticStructure = {
        success: true,
        folderId: folderId,
        folders: [
          {
            id: "folder1",
            name: "Product Certificates",
            mimeType: "application/vnd.google-apps.folder",
            contents: {
              files: [
                {
                  id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  name: "Certificate List_Jan2025.xlsx",
                  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  size: "12345",
                  modifiedTime: "2025-01-01T00:00:00.000Z"
                },
                {
                  id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  name: "PVDF Aluminium Panel Specification 20190605_WM.pdf",
                  mimeType: "application/pdf",
                  size: "23456",
                  modifiedTime: "2019-06-05T00:00:00.000Z"
                },
                {
                  id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  name: "Powder Coating Aluminium Panel Specification 20190709_WM.pdf",
                  mimeType: "application/pdf",
                  size: "34567",
                  modifiedTime: "2019-07-09T00:00:00.000Z"
                },
                {
                  id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  name: "PPG Color Chart.pdf",
                  mimeType: "application/pdf",
                  size: "45678",
                  modifiedTime: "2025-01-01T00:00:00.000Z"
                }
              ],
              folders: []
            }
          },
          {
            id: "folder2",
            name: "Quality Assurance",
            mimeType: "application/vnd.google-apps.folder",
            contents: {
              files: [
                {
                  id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  name: "Quality Control Report 2025.pdf",
                  mimeType: "application/pdf",
                  size: "56789",
                  modifiedTime: "2025-01-01T00:00:00.000Z"
                }
              ],
              folders: []
            }
          }
        ],
        files: [],
        totalItems: 2
      };

      setFolderStructure(staticStructure);
    } catch (error) {
      console.error("Error loading static folder structure:", error);
      setError("ファイル構造の読み込み中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ページ読み込み時に自動的にフォルダ構造を取得
  useEffect(() => {
    if (folderId) {
      loadStaticFolderStructure();
    }
  }, []);

  // サブフォルダの内容を取得（静的）
  const loadSubFolderContents = (subFolderId: string, subFolderName: string) => {
    try {
      console.log(`Loading contents for subfolder: ${subFolderName} (${subFolderId})`);
      
      // 既にコンテンツが設定されている場合は何もしない
      setFolderStructure(prev => {
        if (!prev) return prev;
        
        const updateFolderContents = (folders: any[]): any[] => {
          return folders.map(folder => {
            if (folder.id === subFolderId && !folder.contents) {
              // サブフォルダの内容を設定（既に設定されている場合はスキップ）
              return { ...folder, contents: folder.contents || {} };
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
    } catch (error) {
      console.error("Error loading subfolder contents:", error);
    }
  };

  // フォルダの展開/折りたたみ
  const toggleFolder = (folderId: string, folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      // フォルダを展開するときに内容を取得
      loadSubFolderContents(folderId, folderName);
    }
    
    setExpandedFolders(newExpanded);
  };

  // ファイルを直接ダウンロード
  const handleDownloadFile = (file: any) => {
    try {
      // Google DriveのダウンロードURLを生成
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=AIzaSyAVhBDAR1knpgN_6ZnDKOy5HKVdqpm9_48`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  // ファイルをプレビュー
  const handlePreviewFile = async (file: any) => {
    setPreviewModal({
      isOpen: true,
      fileId: file.id,
      fileName: file.name
    });
  };

  const handleShare = async (file: any) => {
    // Web Share APIが利用可能かチェック
    if (navigator.share) {
      try {
        // Google Driveの直接ダウンロードURLを構築
        const fileUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        
        await navigator.share({
          title: file.name,
          text: `KIRII Certification: ${file.name}`,
          url: fileUrl,
        });
      } catch (error) {
        console.log('共有がキャンセルされました:', error);
      }
    } else {
      // Web Share APIが利用できない場合は、URLをクリップボードにコピー
      const fileUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
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
          <div key={folder.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg mb-2">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => toggleFolder(folder.id, folder.name)}
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )}
                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <span className="font-medium whitespace-nowrap min-w-max text-sm sm:text-base">{folder.name}</span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-2">
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
          <div key={file.id} className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg mb-2 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* ファイル名とサイズ - 独立した行で全幅使用 */}
              <div className="w-full">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full">
                  <h3 className="text-base sm:text-lg font-semibold whitespace-nowrap min-w-max">{file.name}</h3>
                </div>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '大小不明'}
                  </p>
              </div>
              
              {/* チェックボックス、アイコン、ボタン - 別の行 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => handleFileSelection(file.id)}
                    className="h-4 w-4"
                  />
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-center space-x-2"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm">Preview</span>
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-[#02315a] text-white hover:bg-[#02315a] px-3 py-2 rounded-lg flex items-center justify-center space-x-2"
                    onClick={() => handleDownloadFile(file)}
                  >
                    <span className="text-sm">📄 Download PDF</span>
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-center space-x-2"
                    onClick={() => handleShare(file)}
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full py-10 px-2 sm:px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Certification</h1>
        <p className="text-muted-foreground mt-2">認證文件</p>
      </div>

      <div className="space-y-6">
        {/* ローディング表示 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-6 border rounded-lg bg-white">
            <div className="text-red-600 text-center">
              <p className="text-lg font-semibold">發生錯誤</p>
              <p className="text-sm mt-2">{error}</p>
              <Button
                onClick={fetchFolderStructure}
                className="mt-4 bg-[#02315a] hover:bg-[#02315a]/90 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重試
              </Button>
            </div>
          </div>
        )}

        {/* フォルダ構造表示 */}
        {folderStructure && (
          <div className="space-y-6">
            {/* 選択されたファイルのダウンロードボタン */}
            {selectedFiles.length > 0 && (
              <div className="p-4 border rounded-lg bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:justify-between">
                  <span className="text-sm sm:text-base">已選擇檔案: {selectedFiles.length}個</span>
                  <Button
                    onClick={handleDownloadSelected}
                    size="sm"
                    className="bg-[#02315a] hover:bg-[#02315a]/90 text-white w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下載選擇的檔案
                  </Button>
                </div>
              </div>
            )}

            {/* フォルダ構造の表示 - 枠線なし */}
            <div className="pt-6">
              {renderFolderStructure(folderStructure.folders || [], folderStructure.files || [], 0)}
            </div>
          </div>
        )}

        {/* 使用方法の説明 */}
        {!folderStructure && !isLoading && !error && (
          <div className="p-6 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-4">認證文件</h3>
            <div className="space-y-3 text-sm">
              <p>正在從Google Drive自動獲取認證文件...</p>
              <p>點擊資料夾展開，並下載檔案。</p>
            </div>
          </div>
        )}

        {/* PDFプレビューモーダル */}
        <PDFPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, fileId: "", fileName: "" })}
          fileId={previewModal.fileId}
          fileName={previewModal.fileName}
        />
      </div>
    </div>
  )
} 