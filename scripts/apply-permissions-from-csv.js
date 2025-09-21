#!/usr/bin/env node
/* Apply permissions to Supabase profiles based on a normalized CSV.
   Usage: node scripts/apply-permissions-from-csv.js <normalized_csv_path>
*/
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFromVercelConfig() {
  try {
    const vercelPath = path.resolve(process.cwd(), 'vercel.json');
    const raw = fs.readFileSync(vercelPath, 'utf8');
    const json = JSON.parse(raw);
    return json.env || {};
  } catch (_) {
    return {};
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') { inQuotes = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/apply-permissions-from-csv.js <normalized_csv_path>');
    process.exit(1);
  }
  const content = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) { console.error('Empty CSV.'); process.exit(1); }
  const header = parseCsvLine(lines[0]);
  const colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
  const required = ['id','email','department','is_admin'];
  for (const r of required) {
    if (!(r in colIndex)) { console.error(`Missing column: ${r}`); process.exit(1); }
  }

  const vercelEnv = loadEnvFromVercelConfig();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || vercelEnv.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || vercelEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let updated = 0, skipped = 0, errors = 0;
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    if (cols.length < header.length) continue;
    const id = cols[colIndex['id']];
    const email = cols[colIndex['email']];
    const department = cols[colIndex['department']];
    const is_admin = (cols[colIndex['is_admin']] || '').toLowerCase() === 'true';
    if (!id && !email) { skipped++; continue; }

    let userId = id;
    if (!userId) {
      // resolve by email
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
      if (error) { console.error('listUsers error:', error); errors++; continue; }
      const found = (data.users || data || []).find(u => u.email === email);
      if (!found) { console.warn('User not found by email:', email); skipped++; continue; }
      userId = found.id;
    }

    const { error: upErr } = await supabase
      .from('profiles')
      .update({ department, is_admin })
      .eq('id', userId);

    if (upErr) {
      console.error('Update error for', email || userId, upErr);
      errors++;
    } else {
      updated++;
    }
  }

  console.log(JSON.stringify({ updated, skipped, errors }));
}

main().catch(err => { console.error(err); process.exit(1); });





