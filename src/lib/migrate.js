import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://hbuwtuskcalyuryhbofz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXd0dXNrY2FseXVyeWhib2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ0MDgyMiwiZXhwIjoyMDk0MDE2ODIyfQ.Ob_OsV0HZjwyDn6wkIniCciWG9VgTMGAAn5tUfpaiuQ';

const supabase = createClient(url, serviceKey);

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function dumpAll() {
  console.log('Supabase projesinden veriler çekiliyor...');
  
  const tables = ['casinos', 'casino_cols', 'fee_rows', 'col_entries', 'transactions', 'expenses', 'settings'];
  let fullSql = '-- Supabase -> MySQL Veri Aktarımı\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n';

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Hata (${table}):`, error.message);
      continue;
    }
    if (!data || data.length === 0) {
      console.log(`[${table}] Tablosu boş veya veri yok.`);
      continue;
    }

    console.log(`[${table}] ${data.length} kayıt bulundu.`);
    const columns = Object.keys(data[0]);
    const colList = columns.map(c => `\`${c}\``).join(', ');

    fullSql += `-- Tablo: ${table} (${data.length} kayıt)\n`;
    for (const row of data) {
      const values = columns.map(c => escapeSQL(row[c])).join(', ');
      fullSql += `INSERT INTO \`${table}\` (${colList}) VALUES (${values}) ON DUPLICATE KEY UPDATE \`id\`=\`id\`;\n`;
    }
    fullSql += '\n';
  }

  fullSql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  fs.writeFileSync('./data/supabase_dump.sql', fullSql, 'utf-8');
  console.log('Tüm veriler başarıyla "./data/supabase_dump.sql" dosyasına kaydedildi!');
}

dumpAll().catch(err => {
  console.error('Genel Hata:', err.message);
});
