export type LegalNameValidation = {
  valid: boolean
  messageEn: string
  messageZh: string
}

const NICKNAME_SUFFIX_PATTERN = /(哥|姐|仔|妹|叔|姨|伯|嬸|爺|婆|生)$/
const CJK_PATTERN = /[\u3400-\u9fff]/
const ENGLISH_NAME_PATTERN = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/

function invalid(messageEn: string, messageZh: string): LegalNameValidation {
  return { valid: false, messageEn, messageZh }
}

function valid(): LegalNameValidation {
  return { valid: true, messageEn: "", messageZh: "" }
}

function validateChineseNameCore(trimmed: string): LegalNameValidation | null {
  if (!trimmed) {
    return invalid("Chinese name is required.", "請填寫中文姓名。")
  }

  if (trimmed.length < 2) {
    return invalid(
      "Chinese name must be at least 2 characters.",
      "中文姓名至少需要2個字。",
    )
  }

  if (!CJK_PATTERN.test(trimmed)) {
    return invalid(
      "Chinese name must use Chinese characters.",
      "中文姓名必須使用中文漢字。",
    )
  }

  if (/^阿.{1,2}$/u.test(trimmed)) {
    return invalid(
      'Informal prefix "阿" is not allowed. Please enter the full legal name.',
      "不可使用「阿」字花名，請填寫法定全名。",
    )
  }

  if (/^小[\u3400-\u9fff]{1,2}$/u.test(trimmed)) {
    return invalid(
      'Informal prefix "小" is not allowed. Please enter the full legal name.',
      "不可使用「小」字花名，請填寫法定全名。",
    )
  }

  if (NICKNAME_SUFFIX_PATTERN.test(trimmed)) {
    return invalid(
      "Nickname-style endings such as 哥 / 姐 / 生 are not allowed. Please enter the full legal name.",
      "不可使用明哥、陳生等非正式稱呼，請填寫法定全名。",
    )
  }

  if (/^[\u3400-\u9fff]{2}$/u.test(trimmed)) {
    return invalid(
      "A 2-character name is often an informal nickname. Please enter the full legal name.",
      "2字名稱通常為花名或非正式稱呼，請填寫法定全名。",
    )
  }

  if (/[\d_@#$%^&*+=<>{}[\]|\\/`~]/.test(trimmed)) {
    return invalid(
      "Name contains invalid characters. Please enter the full legal name.",
      "姓名含有不允許字符，請填寫法定全名。",
    )
  }

  return valid()
}

export function validateLegalChineseName(name: string): LegalNameValidation | null {
  const trimmed = name.trim()
  const result = validateChineseNameCore(trimmed)
  if (!result || result.valid) return result
  return result
}

export function validateLegalEnglishNamePart(
  value: string,
  labelEn: string,
  labelZh: string,
  options: { required?: boolean; minLength?: number } = {},
): LegalNameValidation | null {
  const trimmed = value.trim()
  const minLength = options.minLength ?? 2

  if (!trimmed) {
    if (!options.required) return null
    return invalid(`${labelEn} is required.`, `請填寫${labelZh}。`)
  }

  if (!ENGLISH_NAME_PATTERN.test(trimmed)) {
    return invalid(
      `${labelEn} must use English letters only.`,
      `${labelZh}只可使用英文字母。`,
    )
  }

  if (trimmed.length < minLength) {
    return invalid(
      `${labelEn} must be at least ${minLength} character${minLength === 1 ? "" : "s"}.`,
      `${labelZh}至少需要${minLength}個字母。`,
    )
  }

  return valid()
}

/** @deprecated Use validateLegalChineseName or validateLegalEnglishNamePart */
export function validateLegalContactName(name: string): LegalNameValidation | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  if (CJK_PATTERN.test(trimmed)) {
    return validateLegalChineseName(trimmed)
  }

  return validateLegalEnglishNamePart(trimmed, "Name", "姓名", { required: true })
}

export function collectLegalNameIssues(
  fields: Array<{ key: string; label: string; value: string }>,
): Array<{ key: string; label: string; validation: LegalNameValidation }> {
  return fields.flatMap((field) => {
    const validation = validateLegalContactName(field.value)
    if (!validation || validation.valid) return []
    return [{ key: field.key, label: field.label, validation }]
  })
}
