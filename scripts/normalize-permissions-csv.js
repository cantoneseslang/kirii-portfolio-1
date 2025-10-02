#!/usr/bin/env node
/* Normalize a members-permissions CSV and fix department casing & admin flag.
   Usage: node scripts/normalize-permissions-csv.js <input_csv_path>
   Output: exports/members-permissions-normalized-YYYYMMDD-HHmmss.csv
*/
const fs = require('fs');
const path = require('path');

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

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function normalizeDepartments(value) {
  if (!value) return { deptList: [], isAdminFromDept: false };
  const raw = String(value).split(',').map(s => s.trim()).filter(Boolean);
  const canonical = new Set();
  let admin = false;
  for (const token of raw) {
    const t = token.toLowerCase();
    if (t === 'admin') { admin = true; continue; }
    if (t === 'all employees' || t === 'all-employees' || t === 'allemployees') canonical.add('All Employees');
    else if (t === 'sales') canonical.add('Sales');
    else if (t === 'purchasing') canonical.add('Purchasing');
    else if (t === 'factory' || t === 'factroy') canonical.add('Factory');
    else {
      // Keep unknown token as-is (title case first letter)
      canonical.add(token);
    }
  }
  const order = ['All Employees', 'Sales', 'Purchasing', 'Factory'];
  const rest = Array.from(canonical).filter(v => !order.includes(v)).sort();
  const deptList = order.filter(v => canonical.has(v)).concat(rest);
  if (admin && deptList.length === 0) deptList.push('All Employees');
  return { deptList, isAdminFromDept: admin };
}

function main() {
  const input = process.argv[2];
  if (!input) { console.error('Usage: node scripts/normalize-permissions-csv.js <input_csv_path>'); process.exit(1); }
  const content = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) { console.error('Empty CSV.'); process.exit(1); }
  const header = parseCsvLine(lines[0]);
  const colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
  const required = ['id','full_name','email','department','position','is_admin'];
  for (const r of required) {
    if (!(r in colIndex)) { console.error(`Missing column: ${r}`); process.exit(1); }
  }

  const outRows = [];
  const outHeader = [
    'id','full_name','email','department','position','is_admin',
    'has_all_employees','has_sales','has_purchasing','has_factory','updated_at'
  ];
  outRows.push(outHeader.join(','));

  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    if (cols.length < header.length) continue;
    const id = cols[colIndex['id']];
    const full_name = cols[colIndex['full_name']];
    const email = cols[colIndex['email']];
    const department = cols[colIndex['department']];
    const position = cols[colIndex['position']];
    const is_admin_raw = (cols[colIndex['is_admin']] || '').toLowerCase();
    let is_admin = ['1','true','yes','y','admin'].includes(is_admin_raw);
    const { deptList, isAdminFromDept } = normalizeDepartments(department);
    if (isAdminFromDept) is_admin = true;
    const hasAll = deptList.includes('All Employees');
    const hasSales = deptList.includes('Sales');
    const hasPurchasing = deptList.includes('Purchasing');
    const hasFactory = deptList.includes('Factory');
    const normalizedDept = deptList.join(',');
    const updated_at = cols[colIndex['updated_at']] || '';
    const row = [
      csvEscape(id), csvEscape(full_name), csvEscape(email), csvEscape(normalizedDept), csvEscape(position), csvEscape(is_admin ? 'true':'false'),
      csvEscape(hasAll ? '1':'0'), csvEscape(hasSales ? '1':'0'), csvEscape(hasPurchasing ? '1':'0'), csvEscape(hasFactory ? '1':'0'), csvEscape(updated_at)
    ];
    outRows.push(row.join(','));
  }

  const outDir = path.resolve(process.cwd(), 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const outPath = path.join(outDir, `members-permissions-normalized-${ts}.csv`);
  fs.writeFileSync(outPath, outRows.join('\n'), 'utf8');
  console.log(outPath);
}

main();










