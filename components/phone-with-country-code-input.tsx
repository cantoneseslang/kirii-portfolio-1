"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatCountryCodeOptionLabel,
  getPhoneCountryCodeEntry,
  PHONE_COUNTRY_CODES,
} from "@/lib/phone-country-codes"

type PhoneWithCountryCodeInputProps = {
  id: string
  label?: string
  countryCode: string
  phone: string
  onCountryCodeChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function PhoneWithCountryCodeInput({
  id,
  label = "Phone / 電話",
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
}: PhoneWithCountryCodeInputProps) {
  const selectedCode = countryCode || "+852"
  const selectedEntry = getPhoneCountryCodeEntry(selectedCode)

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-phone`}>{label}</Label>
      <div className="flex gap-2">
        <Select value={selectedCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger id={`${id}-country-code`} className="w-[5.5rem] shrink-0">
            <SelectValue placeholder="+852">{selectedCode}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80 min-w-[20rem]">
            {PHONE_COUNTRY_CODES.map((entry) => (
              <SelectItem
                key={entry.code}
                value={entry.code}
                textValue={`${entry.code} ${entry.labelEn} ${entry.labelZh}`}
              >
                {formatCountryCodeOptionLabel(entry)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={`${id}-phone`}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="Local number / 本地號碼"
          className="min-w-0 flex-1"
        />
      </div>
      {selectedEntry && (
        <div className="text-xs text-muted-foreground">
          {selectedEntry.labelEn} / {selectedEntry.labelZh}
        </div>
      )}
    </div>
  )
}
