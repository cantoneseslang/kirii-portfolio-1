import { validateLegalContactName, type LegalNameValidation } from "@/lib/hk-new-customer-name-validation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type LegalNameInputProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function LegalNameInput({ id, label, value, onChange }: LegalNameInputProps) {
  const validation = validateLegalContactName(value)
  const showError = Boolean(validation && !validation.valid)

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

export function LegalNameErrorMessage({ validation }: { validation: LegalNameValidation }) {
  return (
    <p className="text-sm text-red-600" role="alert">
      {validation.messageEn} / {validation.messageZh}
    </p>
  )
}
