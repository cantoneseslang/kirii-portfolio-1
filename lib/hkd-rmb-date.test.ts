import { describe, expect, it } from "vitest"

import {
  formatYmdToShort,
  getCurrentYmdInTimeZone,
  getPreviousBusinessDayYmd,
  normalizeDateToYmd,
  toYmdKey,
} from "./hkd-rmb-date"
import {
  resolveMonthStartComparison,
  resolvePrevBusinessDayComparison,
} from "./hkd-rmb-comparison"

describe("hkd-rmb date normalization", () => {
  it("normalizes non-zero-padded source dates", () => {
    expect(normalizeDateToYmd("2026/4/2")).toBe("2026-04-02")
    expect(normalizeDateToYmd("2026.4.2 10:00")).toBe("2026-04-02")
    expect(normalizeDateToYmd("2026-04-02")).toBe("2026-04-02")
  })

  it("rejects invalid dates", () => {
    expect(normalizeDateToYmd("2026-02-30")).toBeNull()
    expect(normalizeDateToYmd("")).toBeNull()
  })

  it("builds stable numeric keys and display strings", () => {
    expect(toYmdKey("2026-4-2")).toBe(20260402)
    expect(formatYmdToShort("2026-4-2")).toBe("26/04/02")
  })

  it("calculates previous business day with weekend skip", () => {
    expect(getPreviousBusinessDayYmd("2026-04-06")).toBe("2026-04-03")
    expect(getPreviousBusinessDayYmd("2026-04-07")).toBe("2026-04-06")
  })

  it("gets current date in Hong Kong timezone", () => {
    const fixedUtc = new Date("2026-04-02T15:30:00.000Z")
    expect(getCurrentYmdInTimeZone("Asia/Hong_Kong", fixedUtc)).toBe("2026-04-02")
  })
})

describe("hkd-rmb previous day comparison", () => {
  it("uses exact yesterday when it exists", () => {
    const history = [
      { date: "2026-03-31" },
      { date: "2026-04-01" },
      { date: "2026-04-02" },
    ]
    const resolved = resolvePrevBusinessDayComparison(history, "2026-04-02")

    expect(resolved).not.toBeNull()
    expect(resolved?.label).toBe("前一个工作日")
    expect(resolved?.targetDate).toBe("2026-04-01")
    expect(resolved?.point?.date).toBe("2026-04-01")
  })

  it("uses Friday as previous business day on Monday", () => {
    const history = [
      { date: "2026-04-03" },
      { date: "2026-04-02" },
    ]
    const resolved = resolvePrevBusinessDayComparison(history, "2026-04-06")

    expect(resolved).not.toBeNull()
    expect(resolved?.targetDate).toBe("2026-04-03")
    expect(resolved?.point?.date).toBe("2026-04-03")
    expect(resolved?.label).toBe("前一个工作日")
  })

  it("keeps target date even when business day data is missing", () => {
    const history = [{ date: "2026-04-02" }]
    const resolved = resolvePrevBusinessDayComparison(history, "2026-04-06")

    expect(resolved).not.toBeNull()
    expect(resolved?.targetDate).toBe("2026-04-03")
    expect(resolved?.point).toBeNull()
  })
})

describe("hkd-rmb month start comparison", () => {
  it("uses previous month end on the first day of month", () => {
    const history = [
      { date: "2026-03-31" },
      { date: "2026-04-01" },
    ]
    const resolved = resolveMonthStartComparison(history, "2026-04-01")
    expect(resolved).not.toBeNull()
    expect(resolved?.targetDate).toBe("2026-03-31")
    expect(resolved?.point?.date).toBe("2026-03-31")
  })

  it("uses previous month end on the second day of month", () => {
    const history = [
      { date: "2026-03-31" },
      { date: "2026-04-01" },
      { date: "2026-04-02" },
    ]
    const resolved = resolveMonthStartComparison(history, "2026-04-02")
    expect(resolved?.targetDate).toBe("2026-03-31")
    expect(resolved?.point?.date).toBe("2026-03-31")
  })

  it("uses current month first day from the third day onward", () => {
    const history = [
      { date: "2026-04-01" },
      { date: "2026-04-03" },
    ]
    const resolved = resolveMonthStartComparison(history, "2026-04-03")
    expect(resolved?.targetDate).toBe("2026-04-01")
    expect(resolved?.point?.date).toBe("2026-04-01")
  })

  it("does not fall back when previous month end is missing", () => {
    const history = [{ date: "2026-03-30" }]
    const resolved = resolveMonthStartComparison(history, "2026-04-01")
    expect(resolved?.targetDate).toBe("2026-03-31")
    expect(resolved?.point).toBeNull()
  })
})
