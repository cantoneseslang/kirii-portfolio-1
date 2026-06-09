"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LegalNameErrorMessage } from "@/components/legal-name-input"
import {
  validateLegalChineseName,
  validateLegalEnglishNamePart,
} from "@/lib/hk-new-customer-name-validation"
import type { ContactNameFields } from "@/lib/hk-new-customer-contact-name"
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
  validation: ReturnType<typeof validateLegalEnglishNamePart>
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
  const firstValidation = validateLegalEnglishNamePart(value.nameEnFirst, "Given name", "英文名", {
    required: true,
  })
  const middleValidation = validateLegalEnglishNamePart(value.nameEnMiddle, "Middle name", "英文中間名", {
    required: true,
    minLength: 1,
  })
  const lastValidation = validateLegalEnglishNamePart(value.nameEnLast, "Surname", "英文姓氏", {
    required: true,
  })
  const chineseValidation = validateLegalChineseName(value.nameZh)
  const showChineseError = showErrors && Boolean(chineseValidation && !chineseValidation.valid)

  return (
    <div className="md:col-span-2 space-y-4">
      <div>
        <div className="font-medium">Name / 姓名</div>
        <div className="text-sm text-muted-foreground">
          Enter English given name, middle name, surname, and Chinese name. / 請分別填寫英文名字、中間名、姓氏及中文姓名。
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NameField
          id={`${idPrefix}-en-first`}
          label="Given Name (English) / 英文名 *"
          value={value.nameEnFirst}
          onChange={(nameEnFirst) => onChange({ ...value, nameEnFirst })}
          validation={firstValidation}
          showErrors={showErrors}
        />
        <NameField
          id={`${idPrefix}-en-middle`}
          label="Middle Name (English) / 英文中間名 *"
          value={value.nameEnMiddle}
          onChange={(nameEnMiddle) => onChange({ ...value, nameEnMiddle })}
          validation={middleValidation}
          showErrors={showErrors}
        />
        <NameField
          id={`${idPrefix}-en-last`}
          label="Surname (English) / 英文姓氏 *"
          value={value.nameEnLast}
          onChange={(nameEnLast) => onChange({ ...value, nameEnLast })}
          validation={lastValidation}
          showErrors={showErrors}
        />
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-zh`}>Name (Chinese) / 中文姓名 *</Label>
          <Input
            id={`${idPrefix}-zh`}
            value={value.nameZh}
            onChange={(event) => onChange({ ...value, nameZh: event.target.value })}
            aria-invalid={showChineseError}
            className={cn(showChineseError && "border-red-500 focus-visible:ring-red-500")}
          />
          {showChineseError && chineseValidation && <LegalNameErrorMessage validation={chineseValidation} />}
        </div>
      </div>
    </div>
  )
}
