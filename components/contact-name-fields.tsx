"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LegalNameErrorMessage } from "@/components/legal-name-input"
import {
  getContactNameFieldValidations,
  type ContactNameFields,
} from "@/lib/hk-new-customer-contact-name"
import { cn } from "@/lib/utils"

type ContactNameFieldsProps = {
  idPrefix: string
  value: ContactNameFields
  onChange: (value: ContactNameFields) => void
  showErrors?: boolean
}

function NameField({
  id,
  label,
  value,
  onChange,
  validation,
  showErrors,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  validation: ReturnType<typeof getContactNameFieldValidations>["nameEnFirst"]
  showErrors: boolean
}) {
  const showError = showErrors && Boolean(validation && !validation.valid)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={showError}
        className={cn(showError && "border-red-500 focus-visible:ring-red-500")}
      />
      {showError && validation && <LegalNameErrorMessage validation={validation} />}
    </div>
  )
}

export function ContactNameFields({
  idPrefix,
  value,
  onChange,
  showErrors = false,
}: ContactNameFieldsProps) {
  const validations = getContactNameFieldValidations(value)
  const showSummaryError = showErrors && Boolean(validations.summary && !validations.summary.valid)
  const showChineseError = showErrors && Boolean(validations.nameZh && !validations.nameZh.valid)

  return (
    <div className="md:col-span-2 space-y-4">
      <div>
        <div className="font-medium">Name / 姓名</div>
        <div className="text-sm text-muted-foreground">
          Enter English given name and surname, or a full Chinese legal name. Middle name is optional. /
          請填寫英文名字及姓氏，或填寫中文姓名全名；英文中間名可留空。
        </div>
      </div>
      {showSummaryError && validations.summary && (
        <LegalNameErrorMessage validation={validations.summary} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <NameField
          id={`${idPrefix}-en-first`}
          label="Given Name (English) / 英文名"
          value={value.nameEnFirst}
          onChange={(nameEnFirst) => onChange({ ...value, nameEnFirst })}
          validation={validations.nameEnFirst}
          showErrors={showErrors}
        />
        <NameField
          id={`${idPrefix}-en-middle`}
          label="Middle Name (English) / 英文中間名"
          value={value.nameEnMiddle}
          onChange={(nameEnMiddle) => onChange({ ...value, nameEnMiddle })}
          validation={validations.nameEnMiddle}
          showErrors={showErrors}
        />
        <NameField
          id={`${idPrefix}-en-last`}
          label="Surname (English) / 英文姓氏"
          value={value.nameEnLast}
          onChange={(nameEnLast) => onChange({ ...value, nameEnLast })}
          validation={validations.nameEnLast}
          showErrors={showErrors}
        />
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-zh`}>Name (Chinese) / 中文姓名</Label>
          <Input
            id={`${idPrefix}-zh`}
            value={value.nameZh}
            onChange={(event) => onChange({ ...value, nameZh: event.target.value })}
            aria-invalid={showChineseError}
            className={cn(showChineseError && "border-red-500 focus-visible:ring-red-500")}
          />
          {showChineseError && validations.nameZh && (
            <LegalNameErrorMessage validation={validations.nameZh} />
          )}
        </div>
      </div>
    </div>
  )
}
