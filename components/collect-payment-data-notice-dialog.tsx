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
                Please check the data in &ldquo;2026-MONTHLY CUSTOMER ALLOCATION&rdquo; in{" "}
                <a
                  href={SALES_AMOUNT_ACCESS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 underline"
                >
                  Sales Amount Management / 銷售金額統計表
                </a>
                .
              </p>
              <p>
                請查看{" "}
                <a
                  href={SALES_AMOUNT_ACCESS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 underline"
                >
                  Sales Amount Management / 銷售金額統計表
                </a>
                入面嘅「2026-MONTHLY CUSTOMER ALLOCATION」數據。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpen(false)}>OK / 確認</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
