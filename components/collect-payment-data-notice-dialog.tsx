"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SALES_AMOUNT_ACCESS_URL = "/api/sales-amount/access";

export default function CollectPaymentDataNoticeDialog() {
  const [open, setOpen] = useState(true);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Data Notice / 數據提示</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This table is sourced from format7. Payment records are approximately one month old.
                For the latest information, please refer to:
              </p>
              <p>
                此表嘅數據來自 format7，付款記錄係大約一個月前嘅資料。如需最新資訊，請參閱：
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Sales Amount Management / 銷售金額統計表
                </span>
              </p>
              <a
                href={SALES_AMOUNT_ACCESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 underline break-all"
              >
                {SALES_AMOUNT_ACCESS_URL}
              </a>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <a
            href={SALES_AMOUNT_ACCESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            Open Sales Amount Management / 開啟銷售金額統計表
          </a>
          <AlertDialogAction onClick={() => setOpen(false)}>OK / 確認</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
