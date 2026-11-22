// Thin data layer over Supabase. Every query goes through here.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const configured = !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-');
export const sb = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const PAGE = 1000;

function check({ data, error }) {
  if (error) throw new Error(error.message || String(error));
  return data;
}

function applyFilters(q, opts = {}) {
  for (const [k, v] of Object.entries(opts.eq || {})) {
    if (v === null) q = q.is(k, null); else if (v !== undefined && v !== '') q = q.eq(k, v);
  }
  for (const [k, v] of Object.entries(opts.in || {})) if (v && v.length) q = q.in(k, v);
  if (opts.gte) for (const [k, v] of Object.entries(opts.gte)) if (v) q = q.gte(k, v);
  if (opts.lte) for (const [k, v] of Object.entries(opts.lte)) if (v) q = q.lte(k, v);
  for (const o of opts.order || []) q = q.order(o[0], { ascending: o[1] !== false });
  return q;
}

export const db = {
  // select all rows (pages through the 1000-row API limit)
  async list(table, opts = {}) {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      let q = sb.from(table).select(opts.select || '*');
      q = applyFilters(q, opts).range(from, from + PAGE - 1);
      const rows = check(await q);
      // reporting views: make sure counts are numbers (some servers send large integers as text)
      if (table.startsWith('v_')) rows.forEach(r => { for (const k in r) if (k !== 'specialization' && typeof r[k] === 'string' && /^-?\d+$/.test(r[k])) r[k] = Number(r[k]); });
      out.push(...rows);
      if (rows.length < PAGE || (opts.limit && out.length >= opts.limit)) break;
    }
    return opts.limit ? out.slice(0, opts.limit) : out;
  },
  async get(table, id) {
    const rows = check(await sb.from(table).select('*').eq('id', id).limit(1));
    return rows[0] || null;
  },
  async insert(table, row) {
    const rows = check(await sb.from(table).insert(row).select());
    return rows[0];
  },
  async update(table, id, patch) {
    const rows = check(await sb.from(table).update(patch).eq('id', id).select());
    if (!rows.length) throw new Error('No permission to change this record');
    return rows[0];
  },
  async remove(table, id) {
    check(await sb.from(table).delete().eq('id', id));
  },
  async upsert(table, rows, onConflict) {
    return check(await sb.from(table).upsert(rows, { onConflict }).select());
  },
};

export const auth = {
  async session() { return check(await sb.auth.getSession()).session; },
  async signIn(email, password) { return check(await sb.auth.signInWithPassword({ email, password })); },
  async signUp(email, password, meta) {
    return check(await sb.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: location.href.split('#')[0] } }));
  },
  async signOut() { await sb.auth.signOut(); },
  async reset(email) { return check(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] })); },
  async setPassword(password) { return check(await sb.auth.updateUser({ password })); },
  onChange(cb) { return sb.auth.onAuthStateChange(cb); },
};
