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
import { Textarea } from "@/components/ui/textarea"
import { ADDRESS_REGIONS, HK_ADDRESS_AREAS } from "@/lib/hk-new-customer-address"
import type { AddressRegion, HkAddressArea, StructuredAddress } from "@/types/hk-new-customer"

type HkAddressFieldsProps = {
  idPrefix: string
  titleEn: string
  titleZh: string
  value: StructuredAddress
  onChange: (value: StructuredAddress) => void
}

export function HkAddressFields({ idPrefix, titleEn, titleZh, value, onChange }: HkAddressFieldsProps) {
  const isOverseas = value.region === "overseas"
  const isHongKong = value.region === "hong_kong"
  const isMacau = value.region === "macau"
  const isChina = value.region === "china"

  const updateRegion = (region: AddressRegion) => {
    onChange({
      ...value,
      region,
      area: region === "hong_kong" ? value.area : undefined,
      postalCode: region === "china" ? value.postalCode || "" : "",
      addressZh: region === "overseas" ? "" : value.addressZh,
    })
  }

  const updateArea = (area: HkAddressArea) => {
    onChange({ ...value, area })
  }

  const districtPlaceholder = isHongKong
    ? "e.g. Central, Mong Kok / 例如：中環、旺角"
    : isMacau
      ? "e.g. Nape, Taipa / 例如：沙格斯、氹仔"
      : "e.g. Guangdong, Shenzhen, Nanshan / 例如：廣東省、深圳市、南山區"

  return (
    <div className="space-y-4 rounded-lg border p-4 md:col-span-2">
      <div>
        <div className="font-medium">{titleEn}</div>
        <div className="text-sm text-muted-foreground">{titleZh}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-region`}>Region / 地區</Label>
          <Select value={value.region} onValueChange={(next) => updateRegion(next as AddressRegion)}>
            <SelectTrigger id={`${idPrefix}-region`}>
              <SelectValue placeholder="Select region / 選擇地區" />
            </SelectTrigger>
            <SelectContent>
              {ADDRESS_REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.labelEn} / {region.labelZh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isHongKong && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-area`}>Area / 區域</Label>
            <Select
              value={value.area || ""}
              onValueChange={(next) => updateArea(next as HkAddressArea)}
            >
              <SelectTrigger id={`${idPrefix}-area`}>
                <SelectValue placeholder="Select area / 選擇區域" />
              </SelectTrigger>
              <SelectContent>
                {HK_ADDRESS_AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.labelEn} / {area.labelZh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isOverseas && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-district`}>
              {isChina ? "Province / City / District / 省市区" : "District / 分區"}
            </Label>
            <Input
              id={`${idPrefix}-district`}
              value={value.district}
              onChange={(event) => onChange({ ...value, district: event.target.value })}
              placeholder={districtPlaceholder}
            />
          </div>
        )}

        {isChina && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-postal-code`}>Postal Code / 郵編</Label>
            <Input
              id={`${idPrefix}-postal-code`}
              value={value.postalCode || ""}
              onChange={(event) => onChange({ ...value, postalCode: event.target.value })}
              placeholder="e.g. 518000"
              inputMode="numeric"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-address-en`}>
          {isOverseas ? "Address (English only) / 地址（只限英文）" : "Address (English) / 地址（英文）"}
        </Label>
        <Textarea
          id={`${idPrefix}-address-en`}
          value={value.addressEn}
          onChange={(event) => onChange({ ...value, addressEn: event.target.value })}
          placeholder={
            isOverseas
              ? "Full overseas address in English"
              : "Room, floor, building, street / 室、樓層、大廈、街道"
          }
          rows={3}
        />
      </div>

      {!isOverseas && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-address-zh`}>Address (Chinese) / 地址（中文）</Label>
          <Textarea
            id={`${idPrefix}-address-zh`}
            value={value.addressZh}
            onChange={(event) => onChange({ ...value, addressZh: event.target.value })}
            placeholder="室、樓層、大廈、街道"
            rows={3}
          />
        </div>
      )}
    </div>
  )
}
