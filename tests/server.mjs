import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
// Local test server: serves the app with a mock Supabase client and runs every query in PostgreSQL
// under the signed-in user's role, so row-level security is exercised.  Usage:
//   npm i pg && node tests/server.mjs . 8787 <database>
const require = createRequire(process.cwd() + '/'); const { Pool } = require('pg');
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(process.argv[2] || '.'); const PORT = Number(process.argv[3] || 8787);
const pool = new Pool({ host: process.env.PGHOST || '/tmp/pg', port: Number(process.env.PGPORT || 5433), user: 'postgres', database: process.argv[4] || 'rec' });
const id = (s) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error('bad ident ' + s); return '"' + s + '"'; };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
async function q(b) {
  const c = await pool.connect();
  try {
    if (b.op === 'signup') {
      const r = await c.query('insert into auth.users(email, encrypted_password, raw_user_meta_data) values ($1,$2,$3) returning id,email', [b.email, b.password, b.meta || {}]);
      return r.rows[0];
    }
    if (b.op === 'signin') {
      const r = await c.query('select id,email from auth.users where email=$1 and encrypted_password=$2', [b.email, b.password]);
      if (!r.rows.length) throw new Error('Invalid login credentials'); return r.rows[0];
    }
    await c.query('begin');
    await c.query(`set local role ${b.uid ? 'authenticated' : 'anon'}`);
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: b.uid || '', role: b.uid ? 'authenticated' : 'anon' })]);
    const params = []; const p = (v) => { params.push(v); return '$' + params.length; };
    const where = () => b.filters && b.filters.length ? ' where ' + b.filters.map(([k, o, v]) =>
      o === 'eq' ? `${id(k)} = ${p(v)}` : o === 'is' ? `${id(k)} is null` : o === 'in' ? `${id(k)}::text = any(${p(v.map(String))})` :
      o === 'gte' ? `${id(k)} >= ${p(v)}` : `${id(k)} <= ${p(v)}`).join(' and ') : '';
    const T = 'public.' + id(b.table); let sql;
    if (b.op === 'select') {
      const cols = b.cols === '*' ? '*' : b.cols.split(',').map(s => id(s.trim())).join(',');
      sql = `select ${cols} from ${T}${where()}${b.order.length ? ' order by ' + b.order.map(([k, a]) => `${id(k)} ${a ? 'asc' : 'desc'}`).join(',') : ''}`;
      if (b.range) sql += ` offset ${Number(b.range[0])} limit ${Number(b.range[1]) - Number(b.range[0]) + 1}`;
    } else if (b.op === 'insert' || b.op === 'upsert') {
      const keys = [...new Set(b.values.flatMap(Object.keys))];
      sql = `insert into ${T} (${keys.map(id).join(',')}) select ${keys.map(id).join(',')} from json_populate_recordset(null::${T}, ${p(JSON.stringify(b.values))})`;
      if (b.op === 'upsert') { const oc = b.onConflict.split(',').map(s => s.trim()); const upd = keys.filter(k => !oc.includes(k));
        sql += ` on conflict (${oc.map(id).join(',')}) do ${upd.length ? 'update set ' + upd.map(k => `${id(k)} = excluded.${id(k)}`).join(',') : 'nothing'}`; }
      sql += ' returning *';
    } else if (b.op === 'update') {
      const keys = Object.keys(b.values);
      sql = `update ${T} set (${keys.map(id).join(',')}) = (select ${keys.map(id).join(',')} from json_populate_record(null::${T}, ${p(JSON.stringify(b.values))}))${where()} returning *`;
    } else if (b.op === 'delete') sql = `delete from ${T}${where()}`;
    const r = await c.query(sql, params);
    await c.query('commit');
    return r.rows;
  } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
}
http.createServer(async (req, res) => {
  try {
    if (req.url === '/__q') {
      let body = ''; for await (const ch of req) body += ch;
      try { const data = await q(JSON.parse(body)); res.end(JSON.stringify({ data })); }
      catch (e) { res.end(JSON.stringify({ error: e.message })); }
      return;
    }
    let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]); if (u === '/') u = '/index.html';
    if (u === '/assets/js/config.js') { res.setHeader('content-type', 'text/javascript'); return res.end(`export const SUPABASE_URL='http://localhost:${PORT}'; export const SUPABASE_ANON_KEY='test';`); }
    if (u === '/assets/vendor/supabase.js') { res.setHeader('content-type', 'text/javascript'); return res.end(fs.readFileSync(path.join(HERE, 'mock-supabase.js'))); }
    const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.statusCode = 404; return res.end('nf'); }
    res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
  } catch (e) { res.statusCode = 500; res.end(String(e)); }
}).listen(PORT, () => console.log('listening ' + PORT));
