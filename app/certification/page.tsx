"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, FileText, Download, RefreshCw, ChevronRight, ChevronDown, Eye, Share2 } from "lucide-react"
// driveダウンロードはサーバーAPI経由のIDを使って直接URL生成
import { PDFPreviewModal } from "@/components/pdf-preview-modal"

export default function CertificationPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folderId, setFolderId] = useState("1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It"); // envのTARGET_FOLDER_ID相当
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [folderStructure, setFolderStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; fileId: string; fileName: string }>({
    isOpen: false,
    fileId: "",
    fileName: ""
  });
  const CACHE_KEY = 'cert_counts_cache_v1';
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10分
  const GLOBAL_CACHE_KEY = 'cert_global_stats_v1';
  const GLOBAL_TTL_MS = 10 * 60 * 1000;

  const [totalFiles, setTotalFiles] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<{ name: string; modifiedTime: string } | null>(null);

  const readCache = (): any => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return { ts: 0, counts: {} };
      const obj = JSON.parse(raw);
      if (!obj.ts || Date.now() - obj.ts > CACHE_TTL_MS) return { ts: 0, counts: {} };
      return obj;
    } catch (_) {
      return { ts: 0, counts: {} };
    }
  };

  const writeCache = (counts: any) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), counts }));
    } catch (_) {}
  };

  const readGlobalCache = () => {
    try {
      const raw = localStorage.getItem(GLOBAL_CACHE_KEY);
      if (!raw) return { ts: 0, total: null, latest: null };
      const obj = JSON.parse(raw);
      if (!obj.ts || Date.now() - obj.ts > GLOBAL_TTL_MS) return { ts: 0, total: null, latest: null };
      return obj;
    } catch (_) {
      return { ts: 0, total: null, latest: null };
    }
  };
  const writeGlobalCache = (total: number, latest: any) => {
    try {
      localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify({ ts: Date.now(), total, latest }));
    } catch (_) {}
  };

  // ルートフォルダの構造をサーバーから取得（SSRエンドポイント経由）
  const fetchFolderStructure = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/files`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load');

      const { categories = {}, folders: apiFolders = [], folderId: apiFolderId, rootTotalFileCount } = data;
      const cache = readCache();
      const folders = (apiFolders || []).map((f:any) => ({
        ...f,
        totalFileCount: cache.counts?.[f.id],
        contents: { files: [], folders: [] }
      }));
      const rootFiles = data.files || categories['Root Files']?.files || [];
      const structure = {
        success: true,
        folderId: apiFolderId || folderId,
        folders: folders.map((f:any)=>({ ...f })),
        files: rootFiles,
        totalItems: folders.length + rootFiles.length
      } as any;
      // ルート合計件数（初期はキャッシュ値で合算）
      structure.totalFileCount = (folders || []).reduce((sum:number, f:any)=> sum + (f.totalFileCount ?? f.fileCount ?? 0), 0) + (rootFiles?.length || 0);
      setFolderStructure(structure);

      // 初期表示時に各トップレベルフォルダの合計件数をバックグラウンドで取得して更新
      try {
        const folderIds = (folders || []).map((f:any) => f.id);
        // 並列度を制限（6）
        const pool = async (ids: string[], limit = 6) => {
          const results: any = {};
          let i = 0;
          const workers = new Array(Math.min(limit, ids.length)).fill(0).map(async () => {
            while (i < ids.length) {
              const fid = ids[i++];
              try {
                const sres = await fetch(`/api/files?folderId=${encodeURIComponent(fid)}`, { cache: 'no-store' });
                const sdata = await sres.json();
                const sfiles = sdata.categories?.['Root Files']?.files || sdata.items || sdata.files || [];
                const schild = sdata.folders || [];
                const agg = (schild || []).reduce((sum:number, cf:any)=> sum + (cf.fileCount || 0), 0) + (sfiles?.length || 0);
                results[fid] = agg;
                setFolderStructure((prev:any) => {
                  if (!prev) return prev;
                  const updatedFolders = (prev.folders || []).map((f:any)=> f.id===fid ? { ...f, totalFileCount: agg } : f);
                  const rootAgg = updatedFolders.reduce((sum:number, f:any)=> sum + (f.totalFileCount ?? f.fileCount ?? 0), 0) + (prev.files?.length || 0);
                  return { ...prev, folders: updatedFolders, totalFileCount: rootAgg };
                });
              } catch (_) {}
            }
          });
          await Promise.all(workers);
          return results;
        };
        const newCounts = await pool(folderIds, 6);
        writeCache({ ...(cache.counts || {}), ...newCounts });
      } catch (e) {
        console.warn('Background total counting failed', e);
      }

      // 全体トータルと最新更新ファイル名をバックグラウンド集計
      try {
        const gcache = readGlobalCache();
        if (gcache.total != null && gcache.latest) {
          setTotalFiles(gcache.total);
          setLastUpdated(gcache.latest);
        }
        // BFSで全フォルダを巡回
        const queue: string[] = (folders || []).map((f:any)=> f.id);
        let total = (rootFiles?.length || 0);
        let latest: any = rootFiles.reduce((acc:any, f:any)=>{
          const t = Date.parse(f.modifiedTime || '');
          if (!acc || t > Date.parse(acc.modifiedTime || '')) return f;
          return acc;
        }, null);

        const run = async (fid: string) => {
          const res = await fetch(`/api/files?folderId=${encodeURIComponent(fid)}`, { cache: 'no-store' });
          const data = await res.json();
          const files = data.files || data.categories?.['Root Files']?.files || [];
          const childFolders = data.folders || [];
          total += files.length;
          for (const cf of childFolders) queue.push(cf.id);
          for (const file of files) {
            const t = Date.parse(file.modifiedTime || '');
            if (!latest || t > Date.parse(latest.modifiedTime || '')) latest = file;
          }
        };
        // 並列制御
        const workers: Promise<void>[] = [];
        const limit = 6;
        for (let k = 0; k < Math.min(limit, queue.length); k++) {
          workers.push((async () => {
            while (queue.length) {
              const id = queue.shift() as string;
              await run(id);
              // 途中経過をUIに反映
              setTotalFiles((prev)=> (total));
              if (latest) setLastUpdated({ name: latest.name, modifiedTime: latest.modifiedTime });
            }
          })());
        }
        await Promise.all(workers);
        setTotalFiles(total);
        if (latest) setLastUpdated({ name: latest.name, modifiedTime: latest.modifiedTime });
        writeGlobalCache(total, latest ? { name: latest.name, modifiedTime: latest.modifiedTime } : null);
      } catch (e) {
        console.warn('Global stats aggregation failed', e);
      }
    } catch (e:any) {
      setError(e.message || '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ページ読み込み時に自動的にフォルダ構造を取得
  useEffect(() => {
    fetchFolderStructure();
  }, []);

  // サブフォルダの内容を取得（静的）
  const loadSubFolderContents = async (subFolderId: string, subFolderName: string) => {
    try {
      const res = await fetch(`/api/files?folderId=${encodeURIComponent(subFolderId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load subfolder');
      const files = data.categories?.['Root Files']?.files || data.items || data.files || [];
      const childFolders = data.folders || [];
      const aggregate = (childFolders || []).reduce((sum:any, cf:any) => sum + (cf.fileCount || 0), 0) + (files?.length || 0);
      setFolderStructure((prev: any) => {
        if (!prev) return prev;
        const update = (currentFolders: any[]): any[] => currentFolders.map((f:any) => {
          if (f.id === subFolderId) {
            return { ...f, totalFileCount: aggregate, contents: { ...(f.contents || {}), files, folders: childFolders } };
          }
          if (f.contents?.folders) {
            return { ...f, contents: { ...f.contents, folders: update(f.contents.folders) } };
          }
          return f;
        });
        return { ...prev, folders: update(prev.folders) };
      });
    } catch (e) {
      console.error('Error loading subfolder contents:', e);
      alert('子フォルダの読み込みに失敗しました');
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
      // Google Driveの直接ダウンロードURL（権限がある前提）
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      
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
    
    const sortedFolders = [...(folders || [])].sort((a:any,b:any)=> (a.name||'').localeCompare(b.name||'', 'en'));
    const sortedFiles = [...(files || [])].sort((a:any,b:any)=> (a.name||'').localeCompare(b.name||'', 'en'));

    return (
      <div className="space-y-4">
        {/* フォルダの表示 */}
        {sortedFolders.map((folder) => (
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
                {folder.totalFileCount !== undefined
                  ? `${folder.totalFileCount} files`
                  : folder.fileCount !== undefined
                  ? `${folder.fileCount} files`
                  : (folder.contents ? `${folder.contents.files?.length || 0} files` : 'Click to expand')}
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
        {sortedFiles.map((file) => (
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
        <div className="mt-2 text-sm text-gray-600">
          <span className="mr-4">Total Files: {totalFiles != null ? `${totalFiles} files` : '計算中...'}</span>
          {lastUpdated && (
            <span>Last update file: {lastUpdated.name}</span>
          )}
        </div>
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