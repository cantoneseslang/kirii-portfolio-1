export type LegalNameValidation = {
  valid: boolean
  messageEn: string
  messageZh: string
}

const NICKNAME_SUFFIX_PATTERN = /(哥|姐|仔|妹|叔|姨|伯|嬸|爺|婆|生)$/
const CJK_PATTERN = /[\u3400-\u9fff]/

function invalid(messageEn: string, messageZh: string): LegalNameValidation {
  return { valid: false, messageEn, messageZh }
}

function valid(): LegalNameValidation {
  return { valid: true, messageEn: "", messageZh: "" }
}

export function validateLegalContactName(name: string): LegalNameValidation | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  if (trimmed.length < 3) {
    return invalid(
      "Name must be at least 3 characters. Please enter the full legal name.",
      "姓名至少需要3個字，請填寫法定全名。",
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

  if (CJK_PATTERN.test(trimmed) && NICKNAME_SUFFIX_PATTERN.test(trimmed)) {
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

export function collectLegalNameIssues(
  fields: Array<{ key: string; label: string; value: string }>,
): Array<{ key: string; label: string; validation: LegalNameValidation }> {
  return fields.flatMap((field) => {
    const validation = validateLegalContactName(field.value)
    if (!validation || validation.valid) return []
    return [{ key: field.key, label: field.label, validation }]
  })
}
