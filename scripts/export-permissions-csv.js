#!/usr/bin/env node
/*
  Export current members and permissions to CSV.
  Output: exports/members-permissions-YYYYMMDD-HHmmss.csv
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

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

async function main() {
  const vercelEnv = loadEnvFromVercelConfig();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || vercelEnv.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || vercelEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials. Set env or ensure vercel.json contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, department, position, is_admin, updated_at')
    .order('full_name');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    process.exit(1);
  }

  // Fetch all users via Admin API (to map email by id)
  let users = [];
  let page = 1;
  const perPage = 200;
  // Paginate until empty
  // supabase-js v2: { data: { users }, error } OR supabase.auth.admin.listUsers({ page, perPage }) returns { data, error }
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Error listing users:', error);
      process.exit(1);
    }
    const batch = (data && data.users) ? data.users : data;
    if (!batch || batch.length === 0) break;
    users = users.concat(batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  const idToEmail = new Map(users.map(u => [u.id, u.email]));

  // Build CSV
  const header = [
    'id','full_name','email','department','position','is_admin',
    'has_all_employees','has_sales','has_purchasing','has_factory','updated_at'
  ];

  const rows = [header.join(',')];
  for (const p of profiles || []) {
    const dept = p.department || '';
    const hasAll = dept.includes('All Employees');
    const hasSales = dept.includes('Sales');
    const hasPurchasing = dept.includes('Purchasing');
    const hasFactory = dept.includes('Factory');
    const email = idToEmail.get(p.id) || '';

    const row = [
      csvEscape(p.id),
      csvEscape(p.full_name || ''),
      csvEscape(email),
      csvEscape(dept),
      csvEscape(p.position || ''),
      csvEscape(p.is_admin ? 'true' : 'false'),
      csvEscape(hasAll ? '1' : '0'),
      csvEscape(hasSales ? '1' : '0'),
      csvEscape(hasPurchasing ? '1' : '0'),
      csvEscape(hasFactory ? '1' : '0'),
      csvEscape(p.updated_at || '')
    ];
    rows.push(row.join(','));
  }

  const outDir = path.resolve(process.cwd(), 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const outPath = path.join(outDir, `members-permissions-${ts}.csv`);
  fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
  console.log(outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});










