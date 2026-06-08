#!/usr/bin/env python3
"""Build docxtemplater template from the official Word form."""
from __future__ import annotations

import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    "/Users/sakonhiroki/Library/CloudStorage/GoogleDrive-bestinksalesman@gmail.com/マイドライブ/KIRII/Hong_Kong_New_Customer_Setup_Form_and_Protocol_v3.docx"
)
OUTPUT = ROOT / "public/templates/hk-new-customer-template.docx"

RUN = (
    '<w:r><w:rPr><w:rFonts w:ascii="Heiti TC Medium" '
    'w:eastAsia="Heiti TC Medium" w:hAnsi="Heiti TC Medium"/>'
    "</w:rPr>{content}</w:r>"
)

ANCHOR_FIELDS: list[tuple[str, str]] = [
    ("英文全稱", "{companyNameEn}"),
    ("中文全稱", "{companyNameZh}"),
    ("(商業登記號碼)", "{brNumber}"),
    ("(註冊地址)", "{registeredAddress}"),
    ("(送貨地址)", "{deliveryAddress}"),
    ("(銀行名稱)", "{bankName}"),
    ("(戶口號碼)", "{accountNumber}"),
    ("(銀行代碼 / 國際銀行代碼)", "{bankCode}"),
]

UNIQUE_WT_REPLACEMENTS: list[tuple[str, str]] = [
    ("        /         /         (DD/MM/YYYY)", "{incorporationDate}"),
    ("(戶口名稱)", "(戶口名稱) {accountName}"),
    (
        "HKD $ _______________________ / per month",
        "HKD $ {estimatedMonthlyPurchase} / per month",
    ),
    ("[  ] Advance Payment (預付)", "[{payAdvance}] Advance Payment (預付)"),
    (
        "[  ] 30 Days from Invoice Date (發票日期起計30天)",
        "[{pay30Invoice}] 30 Days from Invoice Date (發票日期起計30天)",
    ),
    ("[  ] 30 Days EOM (月底結算後30天)", "[{pay30Eom}] 30 Days EOM (月底結算後30天)"),
    ("[  ] Other: ___________________________", "[{payOther}] Other: {paymentTermsOther}"),
    (
        "[  ] Copy of Valid Business Registration Certificate (有效商業登記證副本)",
        "[{docBr}] Copy of Valid Business Registration Certificate (有效商業登記證副本)",
    ),
    (
        "[  ] Copy of Certificate of Incorporation (公司註冊證明書副本)",
        "[{docCi}] Copy of Certificate of Incorporation (公司註冊證明書副本)",
    ),
    (
        "[  ] Copy of Latest Annual Return - Form NAR1 (最新周年申報表副本)",
        "[{docNar1}] Copy of Latest Annual Return - Form NAR1 (最新周年申報表副本)",
    ),
    (
        "[  ] Copy of Bank Proof (銀行戶口證明, 如:月結單表頭/空白支票)",
        "[{docBankProof}] Copy of Bank Proof (銀行戶口證明, 如:月結單表頭/空白支票)",
    ),
    ("Date / 日期:", "Date / 日期: {declarationDate}"),
    ("Name &amp; Title / 姓名及職位:", "Name &amp; Title / 姓名及職位: {signerNameTitle}"),
    (
        "[  ] Via Email Only   [  ] Post (郵寄)",
        "[{invoiceEmail}] Via Email Only   [{invoicePost}] Post (郵寄)",
    ),
    (
        "Company Status:  [  ] Live/Active   [  ] Dissolved / Ceased",
        "Company Status:  [{statusLive}] Live/Active   [{statusDissolved}] Dissolved / Ceased",
    ),
    (
        "Bank Proof Check: [  ] Match (相符)  [  ] Discrepancy (不相符)",
        "Bank Proof Check: [{bankMatch}] Match (相符)  [{bankDiscrepancy}] Discrepancy (不相符)",
    ),
    (
        "Findings/Remarks: _____________________________________________",
        "Findings/Remarks: {verificationRemarksInternal}",
    ),
    ("Department: ", "Department: {salesDepartment} "),
    ("Name:", "Name: {salesRepName}"),
    (
        "Checked Date:       /       /      ",
        "Checked Date: {verificationCheckedDate}   ",
    ),
]

CONTACT_SECTIONS: list[tuple[str, str]] = []

CONTACT_NAME_ANCHOR = "主要聯絡人及職位"
CONTACT_EMAIL_ANCHOR = "聯絡人電郵及電話"

CONTACT_FIELDS: list[tuple[str, str]] = [
    ("Name: ", "Name: {contact{n}Name} "),
    ("Title: ", "Title: {contact{n}Title} "),
    ("Email: ", "Email: {contact{n}Email} "),
    ("Phone: ", "Phone: {contact{n}Phone} "),
]


def inject_after_anchor(xml: str, anchor: str, placeholder: str) -> str:
    idx = xml.find(anchor)
    if idx == -1:
        print("Missing anchor:", anchor)
        return xml
    segment = xml[idx : idx + 1500]
    marker = "</w:pPr></w:p>"
    pos = segment.find(marker)
    if pos == -1:
        print("Missing empty cell after:", anchor)
        return xml
    abs_pos = idx + pos
    content = f"<w:t>{placeholder}</w:t>"
    injection = marker.replace("</w:p>", f"{RUN.format(content=content)}</w:p>", 1)
    return xml[:abs_pos] + injection + xml[abs_pos + len(marker) :]


def replace_wt_once(xml: str, old: str, new: str) -> str:
    pattern = re.compile(rf"(<w:t(?:[^>]*)>){re.escape(old)}(</w:t>)")
    return pattern.sub(rf"\1{new}\2", xml, count=1)


def replace_after_nth_anchor(
    xml: str,
    anchor: str,
    old: str,
    new: str,
    occurrence: int = 1,
    window: int = 3000,
) -> str:
    start = 0
    idx = -1
    for _ in range(occurrence):
        idx = xml.find(anchor, start)
        if idx == -1:
            print("Missing nth anchor:", anchor, occurrence)
            return xml
        start = idx + len(anchor)
    segment = xml[idx : idx + window]
    pattern = re.compile(rf"(<w:t(?:[^>]*)>){re.escape(old)}(</w:t>)")
    new_segment, count = pattern.subn(rf"\1{new}\2", segment, count=1)
    if count == 0:
        print("Missing token after nth anchor:", anchor, occurrence, old)
        return xml
    return xml[:idx] + new_segment + xml[idx + window :]


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source template not found: {SOURCE}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, OUTPUT)

    with zipfile.ZipFile(OUTPUT, "r") as zin:
        xml = zin.read("word/document.xml").decode("utf-8")
        other_files = {name: zin.read(name) for name in zin.namelist() if name != "word/document.xml"}

    for anchor, placeholder in ANCHOR_FIELDS:
        xml = inject_after_anchor(xml, anchor, placeholder)

    for number in ("1", "2", "3"):
        occurrence = int(number)
        for old, new_template in CONTACT_FIELDS:
            new = new_template.replace("{n}", number)
            if old in ("Name: ", "Title: "):
                xml = replace_after_nth_anchor(
                    xml,
                    CONTACT_NAME_ANCHOR,
                    old,
                    new,
                    occurrence,
                )
            else:
                xml = replace_after_nth_anchor(
                    xml,
                    CONTACT_EMAIL_ANCHOR,
                    old,
                    new,
                    occurrence,
                )

    xml = replace_after_nth_anchor(
        xml,
        "(會計 / 應付賬款聯絡人)",
        "Name: ",
        "Name: {apContactName} ",
        1,
    )
    xml = replace_after_nth_anchor(
        xml,
        "(賬單電郵及發送方式)",
        "Email: ",
        "Email: {apEmail} ",
        1,
    )

    for old, new in UNIQUE_WT_REPLACEMENTS:
        if old not in xml:
            print("Missing unique token:", old[:60])
            continue
        xml = replace_wt_once(xml, old, new)

    # Signature line uses the underline after the chop label.
    xml = replace_after_nth_anchor(
        xml,
        "(獲授權人簽署及公司蓋印)",
        "_______________________________________",
        "{authorizedSignature}",
        1,
        1200,
    )

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for name, data in other_files.items():
            zout.writestr(name, data)
        zout.writestr("word/document.xml", xml.encode("utf-8"))

    with zipfile.ZipFile(OUTPUT) as z:
        check_xml = z.read("word/document.xml").decode("utf-8")
        for token in [
            "{companyNameEn}",
            "{contact3Name}",
            "{apContactName}",
            "{apEmail}",
            "{authorizedSignature}",
        ]:
            print(token, check_xml.count(token))

    print(f"Template written to {OUTPUT}")


if __name__ == "__main__":
    main()
