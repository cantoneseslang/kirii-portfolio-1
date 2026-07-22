import fs from "fs/promises"
import path from "path"
import {
  INTAKE_SAMPLE_TEMPLATE_FILENAME,
  INTAKE_TEMPLATE_FILENAME,
  intakeTemplateToBuffer,
} from "@/lib/hk-new-customer-intake-template"

function templatePath(filename: string): string {
  return path.join(process.cwd(), "public/templates", filename)
}

/** Serves the curated blank template in public/templates; falls back to generated workbook. */
export async function readIntakeTemplateBuffer(): Promise<Buffer> {
  try {
    return await fs.readFile(templatePath(INTAKE_TEMPLATE_FILENAME))
  } catch {
    return intakeTemplateToBuffer()
  }
}

/** Pre-filled sample workbook for import testing. */
export async function readIntakeSampleTemplateBuffer(): Promise<Buffer> {
  return fs.readFile(templatePath(INTAKE_SAMPLE_TEMPLATE_FILENAME))
}
