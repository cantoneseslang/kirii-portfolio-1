import {
  getFormat7StatementIndexRows,
  getFormat7StatementCustomerList,
  getFormat7StatementDetail,
} from "@/lib/format7-google-sheet";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const reqUrl = new URL(req.url);
    const customerCode = reqUrl.searchParams.get("customerCode")?.trim() || "";
    const statementMonth = reqUrl.searchParams.get("statementMonth")?.trim() || "";

    if (customerCode && statementMonth) {
      const customer = await getFormat7StatementDetail(customerCode, statementMonth);
      if (!customer) {
        return NextResponse.json(
          { error: "customer statement not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        statementMonth: customer.statementMonth,
        statementDate: customer.statementDate,
        customer,
      });
    }

    const [customers, indexRows] = await Promise.all([
      getFormat7StatementCustomerList(),
      getFormat7StatementIndexRows(),
    ]);
    const monthMap = new Map<string, { statementMonth: string; statementDate: string; customerCount: number }>();
    for (const row of indexRows) {
      if (!row.statementMonth) continue;
      const existing = monthMap.get(row.statementMonth);
      if (!existing) {
        monthMap.set(row.statementMonth, {
          statementMonth: row.statementMonth,
          statementDate: row.statementDate,
          customerCount: 1,
        });
      } else {
        existing.customerCount += 1;
      }
    }

    const months = Array.from(monthMap.values()).sort((a, b) =>
      b.statementMonth.localeCompare(a.statementMonth)
    );

    return NextResponse.json({
      latestStatementMonth: months[0]?.statementMonth || null,
      latestStatementDate: months[0]?.statementDate || null,
      months,
      customers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "format7 statements API error" },
      { status: 500 }
    );
  }
}
