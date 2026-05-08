# SMS Recovery Quick Guide (KIRII)

## First, answer this one question

Do you want **real employees' real phones** to receive SMS codes?

- **YES** -> **Twilio is REQUIRED**
- **NO (test only)** -> **Twilio is NOT required** (use Supabase test phone numbers)

---

## Simple decision table

| Goal | Twilio needed? | Notes |
|---|---|---|
| Test UI/flow only | No | Use `Test Phone Numbers and OTPs` in Supabase |
| Recover account for real employees | Yes | Real SMS delivery requires provider (Twilio) |

---

## What each setting means (plain words)

- `Enable phone confirmations`  
  Users must verify phone before phone login works. Keep ON.

- `SMS OTP Expiry`  
  How many seconds OTP is valid. Recommended: 180.

- `SMS OTP Length`  
  Number of OTP digits. Keep 6.

- `SMS Message`  
  Message template. `{{ .Code }}` is replaced by real code.

- `Test Phone Numbers and OTPs`  
  Fake test mode. No real SMS is sent for listed numbers.

Example:

`+819012345678=123456,+818012345678=654321`

Meaning:
- phone `+819012345678` -> OTP is always `123456`
- phone `+818012345678` -> OTP is always `654321`

---

## Your current requirement (from conversation)

- Normal login: email + password
- If password forgotten: recover by SMS route

This means:
- Development testing can start **without Twilio** (test phone list)
- Production use for real staff needs **Twilio**

---

## 3-step setup now (no Twilio cost, test mode)

1. Supabase -> Auth -> Phone: enable phone provider
2. Add test pair(s) in `Test Phone Numbers and OTPs`
3. Open `/forgot-password` -> use "Login with SMS (Phone)" -> enter fixed OTP

If that works, the app flow is correct.

---

## When moving to production

1. Configure Twilio:
   - Account SID
   - Auth Token
   - Message Service SID
2. Remove or minimize test OTP pairs
3. Test one real employee number end-to-end

---

## Bulk register employee phone numbers

If `auth.users` has no phone values, SMS recovery cannot work.

1. Prepare CSV from template:
   - `exports/user-phones-template.csv`
2. Fill real values in E.164 format (`+852...`, `+81...`)
3. Run:

```bash
node scripts/import-user-phones-from-csv.js exports/user-phones-template.csv
```

Required environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
