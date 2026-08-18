import {
  NEW_CUSTOMER_ARCHIVE_PATH,
  NEW_CUSTOMER_WORK_RULES,
} from "@/lib/hk-new-customer-work-rules"

export function NewCustomerWorkRules({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Official archive / 正式存檔: <span className="font-medium text-foreground">{NEW_CUSTOMER_ARCHIVE_PATH}</span>
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-foreground">
        {NEW_CUSTOMER_WORK_RULES.map((rule) => (
          <li key={rule.titleEn}>
            <div className="font-medium">
              {rule.titleEn} / {rule.titleZh}
            </div>
            {compact ? (
              <div className="text-muted-foreground">{rule.bodyZh}</div>
            ) : (
              <>
                <div className="text-muted-foreground">{rule.bodyEn}</div>
                <div className="text-muted-foreground">{rule.bodyZh}</div>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
