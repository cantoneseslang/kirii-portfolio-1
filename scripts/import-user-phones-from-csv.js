#!/usr/bin/env node
/*
  Import phone numbers into Supabase auth users from CSV.

  Usage:
    node scripts/import-user-phones-from-csv.js <csv_path>

  CSV columns:
    email,phone
    Optional: id,phone_confirm
*/

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFromVercelConfig() {
  try {
    const vercelPath = path.resolve(process.cwd(), "vercel.json");
    const raw = fs.readFileSync(vercelPath, "utf8");
    const json = JSON.parse(raw);
    return json.env || {};
  } catch (_) {
    return {};
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function normalizePhone(value) {
  const raw = String(value || "").replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (/^00\d+$/.test(raw)) return `+${raw.slice(2)}`;
  if (/^\d+$/.test(raw)) return `+${raw}`;
  return raw;
}

function isE164Phone(value) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function toBool(value, fallback) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return fallback;
  if (["1", "true", "yes", "y"].includes(v)) return true;
  if (["0", "false", "no", "n"].includes(v)) return false;
  return fallback;
}

async function listAllUsers(supabase) {
  let users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data && data.users ? data.users : data;
    if (!batch || batch.length === 0) break;
    users = users.concat(batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node scripts/import-user-phones-from-csv.js <csv_path>");
    process.exit(1);
  }

  const absInput = path.resolve(process.cwd(), input);
  if (!fs.existsSync(absInput)) {
    console.error("CSV file not found:", absInput);
    process.exit(1);
  }

  const content = fs.readFileSync(absInput, "utf8").replace(/\r\n/g, "\n");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    console.error("CSV is empty.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]).map((x) => x.trim());
  const colIndex = Object.fromEntries(header.map((name, idx) => [name, idx]));
  if (!("phone" in colIndex)) {
    console.error("Missing required column: phone");
    process.exit(1);
  }
  if (!("email" in colIndex) && !("id" in colIndex)) {
    console.error("Missing identifier columns. Add at least one: email or id");
    process.exit(1);
  }

  const vercelEnv = loadEnvFromVercelConfig();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || vercelEnv.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || vercelEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const users = await listAllUsers(supabase);
  const usersByEmail = new Map(users.map((u) => [String(u.email || "").toLowerCase(), u]));
  const usersById = new Map(users.map((u) => [u.id, u]));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let li = 1; li < lines.length; li += 1) {
    const cols = parseCsvLine(lines[li]);
    const email = ("email" in colIndex ? String(cols[colIndex.email] || "") : "").trim().toLowerCase();
    const id = ("id" in colIndex ? String(cols[colIndex.id] || "") : "").trim();
    const phoneRaw = normalizePhone(cols[colIndex.phone] || "");
    const phoneConfirm = toBool(
      "phone_confirm" in colIndex ? cols[colIndex.phone_confirm] : "",
      true
    );

    if (!phoneRaw) {
      console.warn(`line ${li + 1}: phone is empty -> skipped`);
      skipped += 1;
      continue;
    }

    if (!isE164Phone(phoneRaw)) {
      console.error(`line ${li + 1}: invalid E.164 phone (${phoneRaw})`);
      errors += 1;
      continue;
    }

    let user = null;
    if (id) user = usersById.get(id) || null;
    if (!user && email) user = usersByEmail.get(email) || null;
    if (!user) {
      console.error(`line ${li + 1}: user not found (email=${email || "-"}, id=${id || "-"})`);
      errors += 1;
      continue;
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      phone: phoneRaw,
      phone_confirm: phoneConfirm,
    });
    if (error) {
      console.error(`line ${li + 1}: update failed for ${user.email || user.id}: ${error.message}`);
      errors += 1;
      continue;
    }

    updated += 1;
    console.log(`line ${li + 1}: updated ${user.email || user.id} -> ${phoneRaw}`);
  }

  console.log(JSON.stringify({ updated, skipped, errors }));
  if (errors > 0) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
