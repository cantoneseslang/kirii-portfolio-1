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
import { ADDRESS_REGIONS, getHkDistrictsForArea, HK_ADDRESS_AREAS, MACAU_DISTRICTS } from "@/lib/hk-new-customer-address"
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
      district: region === "hong_kong" || region === "macau" ? "" : value.district,
      postalCode: region === "china" ? value.postalCode || "" : "",
      addressZh: region === "overseas" ? "" : value.addressZh,
    })
  }

  const updateArea = (area: HkAddressArea) => {
    const validDistricts = getHkDistrictsForArea(area)
    const district = validDistricts.some((entry) => entry.value === value.district) ? value.district : ""
    onChange({ ...value, area, district })
  }

  const hkDistrictOptions = getHkDistrictsForArea(value.area)
  const districtSelectValue =
    value.district && (isHongKong || isMacau)
      ? (isHongKong
          ? hkDistrictOptions.some((entry) => entry.value === value.district)
          : MACAU_DISTRICTS.some((entry) => entry.value === value.district))
        ? value.district
        : ""
      : value.district

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
            {isHongKong ? (
              <Select
                value={districtSelectValue}
                onValueChange={(next) => onChange({ ...value, district: next })}
                disabled={!value.area}
              >
                <SelectTrigger id={`${idPrefix}-district`}>
                  <SelectValue
                    placeholder={
                      value.area
                        ? "Select district / 選擇分區"
                        : "Select area first / 請先選擇區域"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {hkDistrictOptions.map((district) => (
                    <SelectItem key={district.value} value={district.value}>
                      {district.labelEn} / {district.labelZh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : isMacau ? (
              <Select
                value={districtSelectValue}
                onValueChange={(next) => onChange({ ...value, district: next })}
              >
                <SelectTrigger id={`${idPrefix}-district`}>
                  <SelectValue placeholder="Select district / 選擇分區" />
                </SelectTrigger>
                <SelectContent>
                  {MACAU_DISTRICTS.map((district) => (
                    <SelectItem key={district.value} value={district.value}>
                      {district.labelEn} / {district.labelZh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${idPrefix}-district`}
                value={value.district}
                onChange={(event) => onChange({ ...value, district: event.target.value })}
                placeholder="e.g. Guangdong, Shenzhen, Nanshan / 例如：廣東省、深圳市、南山區"
              />
            )}
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
