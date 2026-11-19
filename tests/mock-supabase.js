// Browser mock of the supabase-js subset used by the app; forwards to the test server.
(function () {
  const LS = 'mock_session';
  const getS = () => JSON.parse(localStorage.getItem(LS) || 'null');
  async function call(body) {
    const s = getS();
    const r = await fetch('/__q', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, uid: s ? s.user.id : null }) });
    const j = await r.json();
    return j.error ? { data: null, error: { message: j.error } } : { data: j.data, error: null };
  }
  class Q {
    constructor(table) { this.b = { table, op: 'select', cols: '*', filters: [], order: [], range: null }; }
    select(c) { if (this.b.op === 'select') this.b.cols = c || '*'; else this.b.returning = true; return this; }
    eq(k, v) { this.b.filters.push([k, 'eq', v]); return this; }
    is(k, v) { this.b.filters.push([k, 'is', v]); return this; }
    in(k, v) { this.b.filters.push([k, 'in', v]); return this; }
    gte(k, v) { this.b.filters.push([k, 'gte', v]); return this; }
    lte(k, v) { this.b.filters.push([k, 'lte', v]); return this; }
    order(k, o) { this.b.order.push([k, !o || o.ascending !== false]); return this; }
    range(a, b) { this.b.range = [a, b]; return this; }
    limit(n) { this.b.range = [0, n - 1]; return this; }
    insert(v) { this.b.op = 'insert'; this.b.values = Array.isArray(v) ? v : [v]; return this; }
    upsert(v, o) { this.b.op = 'upsert'; this.b.values = Array.isArray(v) ? v : [v]; this.b.onConflict = o && o.onConflict; return this; }
    update(v) { this.b.op = 'update'; this.b.values = v; return this; }
    delete() { this.b.op = 'delete'; return this; }
    then(res, rej) { return call(this.b).then(res, rej); }
  }
  const listeners = [];
  window.supabase = { createClient: () => ({
    from: (t) => new Q(t),
    auth: {
      async getSession() { return { data: { session: getS() }, error: null }; },
      async signInWithPassword({ email, password }) {
        const r = await call({ op: 'signin', email, password }); if (r.error) return r;
        localStorage.setItem(LS, JSON.stringify({ user: r.data })); return { data: { session: getS() }, error: null };
      },
      async signUp({ email, password, options }) {
        const r = await call({ op: 'signup', email, password, meta: options.data }); if (r.error) return r;
        localStorage.setItem(LS, JSON.stringify({ user: r.data })); return { data: { session: getS(), user: r.data }, error: null };
      },
      async signOut() { localStorage.removeItem(LS); return { error: null }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
      async updateUser() { return { data: {}, error: null }; },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    },
  }) };
})();
