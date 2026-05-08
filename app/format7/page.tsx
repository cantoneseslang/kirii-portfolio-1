"use client"

import React, { useState } from "react";

export default function Format7Page() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    setSheetUrl(null);
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }
    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-format7", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "アップロードに失敗しました");
      }
      const data = await res.json();
      setResultUrl(data.url);
      setSheetUrl(data.sheetUrl || null);
      // Office Web Viewer でプレビュー用URLを生成（Excel/CSV対応）
      if (data.url) {
        const v = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
          data.url
        )}`;
        setViewerUrl(v);
      } else {
        setViewerUrl(null);
      }
    } catch (e: any) {
      setError(e.message || "エラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Collect payment 回收金額統計表</h1>
      <p className="text-sm text-gray-600 mt-2">
        Excel/CSVをアップロード（Vercel Blob に保存）し、生成リンクから閲覧できます。
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 rounded-md bg-[#02315a] text-white disabled:opacity-60"
        >
          {uploading ? "アップロード中..." : "アップロード"}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 p-4 rounded-lg bg-white border">
          <p className="text-sm font-semibold mb-2">アップロード完了</p>
          <div className="flex flex-col gap-2">
            {resultUrl && (
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline break-all"
              >
                ダウンロードリンク（直接取得）
              </a>
            )}
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline break-all"
              >
                Googleスプレッドシートで開く（最新）
              </a>
            )}
            {viewerUrl && (
              <a
                href={viewerUrl}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline"
              >
                ブラウザでプレビュー（Office Web Viewer）
              </a>
            )}
          </div>
          {viewerUrl && (
            <div className="mt-4">
              <iframe
                src={viewerUrl}
                width="100%"
                height="600"
                className="border rounded-md"
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-semibold">GAS連携（任意）</h2>
        <p className="text-sm text-gray-600">
          既存のGoogle Apps Script（GAS）からもデータ送信が可能です。まずはアップロードと閲覧を優先し、GAS連携は後日設定できます。
        </p>
      </div>
    </div>
  );
}


