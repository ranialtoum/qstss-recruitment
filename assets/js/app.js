// Boot, authentication screens, layout and router
import { configured, auth, db } from './api.js';
import { state, t, en, esc, setLang, can, loadRef, toast, fail, readForm, validate, options, role } from './core.js';

const ROUTES = {
  dashboard:  { mod: './views/dashboard.js',  nav: 'nav_dashboard',  icon: '◧', perm: 'read' },
  structure:  { mod: './views/structure.js',  nav: 'nav_structure',  icon: '▦', perm: 'read' },
  plan:       { mod: './views/plan.js',       nav: 'nav_plan',       icon: '▤', perm: 'read' },
  candidates: { mod: './views/candidates.js', nav: 'nav_candidates', icon: '☰', perm: 'read' },
  candidate:  { mod: './views/candidate.js',  perm: 'read' },
  interviews: { mod: './views/interviews.js', nav: 'nav_interviews', icon: '✎', perm: 'read' },
  interview:  { mod: './views/interview.js',  perm: 'read' },
  reports:    { mod: './views/reports.js',    nav: 'nav_reports',    icon: '▥', perm: 'read' },
  users:      { mod: './views/users.js',      nav: 'nav_users',      icon: '⚇', perm: 'admin' },
  settings:   { mod: './views/settings.js',   nav: 'nav_settings',   icon: '⚙', perm: 'admin' },
};

const app = document.getElementById('app');

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const [name, id] = path.split('/');
  return { name: name || 'dashboard', id, params: Object.fromEntries(new URLSearchParams(qs || '')) };
}
export function go(hash) { location.hash = hash; }

// ---------------- auth screens ----------------
function authShell(inner) {
  app.innerHTML = `<div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand"><div class="logo">QSTSS</div>
        <div><h1>${esc(t('app_full'))}</h1></div>
        <button class="btn ghost small" id="lang">${esc(t('lang_toggle'))}</button></div>
      ${inner}
    </div></div>`;
  document.getElementById('lang').onclick = () => { setLang(state.lang === 'en' ? 'ar' : 'en'); render(); };
}

async function signInView(mode = 'signin') {
  if (mode === 'register') {
    let schools = [];
    try { schools = await db.list('schools', { order: [['sort']] }); } catch (e) { /* anon may not read */ }
    authShell(`<form class="form" id="f">
      <h2>${esc(t('register'))}</h2>
      <label>${esc(t('full_name'))}<input name="full_name" required autocomplete="name"></label>
      <label>${esc(t('email'))}<input name="email" type="email" required autocomplete="email"></label>
      <label>${esc(t('password'))} <small>${esc(t('pw_min'))}</small><input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
      <label>${esc(t('phone'))}<input name="phone" autocomplete="tel"></label>
      <div class="grid2">
        <label>${esc(t('requested_role'))}<select name="requested_role">
          ${['interviewer', 'hr', 'principal', 'viewer'].map(r => `<option value="${r}">${esc(en('role', r))}</option>`).join('')}</select></label>
        <label>${esc(t('requested_school'))}<select name="requested_school_id">${options(schools, '', { empty: '—' })}</select></label>
      </div>
      <label>${esc(t('position_note'))}<input name="position_note"></label>
      <button class="btn primary block">${esc(t('register'))}</button>
      <p class="muted center">${esc(t('have_account'))} <a href="#" id="sw">${esc(t('sign_in'))}</a></p>
    </form>`);
    document.getElementById('sw').onclick = (e) => { e.preventDefault(); signInView('signin'); };
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target; if (!validate(f)) return;
      const v = readForm(f);
      try {
        const res = await auth.signUp(v.email, v.password, {
          full_name: v.full_name, phone: v.phone, requested_role: v.requested_role,
          requested_school_id: v.requested_school_id || '', position_note: v.position_note,
        });
        if (res.session) return boot();
        authShell(`<div class="notice">${esc(t('register_done'))}</div><button class="btn primary block" id="b">${esc(t('sign_in'))}</button>`);
        document.getElementById('b').onclick = () => signInView('signin');
      } catch (err) { fail(err); }
    };
    return;
  }
  if (mode === 'forgot') {
    authShell(`<form class="form" id="f"><h2>${esc(t('forgot'))}</h2>
      <label>${esc(t('email'))}<input name="email" type="email" required></label>
      <button class="btn primary block">${esc(t('send_reset'))}</button>
      <p class="center"><a href="#" id="sw">${esc(t('back'))}</a></p></form>`);
    document.getElementById('sw').onclick = (e) => { e.preventDefault(); signInView('signin'); };
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault(); if (!validate(e.target)) return;
      try { await auth.reset(readForm(e.target).email); toast(t('reset_sent')); signInView('signin'); } catch (err) { fail(err); }
    };
    return;
  }
  authShell(`<form class="form" id="f"><h2>${esc(t('sign_in'))}</h2>
    <label>${esc(t('email'))}<input name="email" type="email" required autocomplete="username"></label>
    <label>${esc(t('password'))}<input name="password" type="password" required autocomplete="current-password"></label>
    <button class="btn primary block">${esc(t('sign_in'))}</button>
    <p class="row-between"><a href="#" id="fg">${esc(t('forgot'))}</a><span>${esc(t('no_account'))} <a href="#" id="sw">${esc(t('register'))}</a></span></p>
  </form>`);
  document.getElementById('sw').onclick = (e) => { e.preventDefault(); signInView('register'); };
  document.getElementById('fg').onclick = (e) => { e.preventDefault(); signInView('forgot'); };
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault(); if (!validate(e.target)) return;
    const v = readForm(e.target);
    try { await auth.signIn(v.email, v.password); await boot(); } catch (err) { fail(err); }
  };
}

function recoveryView() {
  authShell(`<form class="form" id="f"><h2>${esc(t('set_password'))}</h2>
    <label>${esc(t('new_password'))} <small>${esc(t('pw_min'))}</small><input name="password" type="password" minlength="8" required></label>
    <button class="btn primary block">${esc(t('save'))}</button></form>`);
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault(); if (!validate(e.target)) return;
    try { await auth.setPassword(readForm(e.target).password); toast(t('password_updated')); history.replaceState(null, '', location.pathname); boot(); } catch (err) { fail(err); }
  };
}

function pendingView() {
  const rejected = ['rejected', 'disabled'].includes(state.profile?.status);
  authShell(`<div class="pending">
    <div class="pending-icon">${rejected ? '⛔' : '⏳'}</div>
    <h2>${esc(rejected ? t('error') : t('pending_title'))}</h2>
    <p>${esc(rejected ? t('rejected_text') : t('pending_text'))}</p>
    <p class="muted">${esc(state.profile?.email || '')}</p>
    <div class="row gap center"><button class="btn primary" id="r">${esc(t('refresh'))}</button>
    <button class="btn" id="o">${esc(t('sign_out'))}</button></div></div>`);
  document.getElementById('r').onclick = boot;
  document.getElementById('o').onclick = async () => { await auth.signOut(); boot(); };
}

// ---------------- main layout ----------------
function layout() {
  const p = state.profile;
  const nav = Object.entries(ROUTES).filter(([, r]) => r.nav && can(r.perm));
  app.innerHTML = `
  <header class="topbar">
    <button class="icon-btn menu-btn" id="menu" aria-label="menu">☰</button>
    <div class="brand"><span class="logo">QSTSS</span><span class="brand-name">${esc(t('app_name'))}</span></div>
    <div class="top-actions">
      ${can('interview') ? `<a class="btn primary small hide-sm" href="#/interview/new">＋ ${esc(t('nav_new_interview'))}</a>` : ''}
      <button class="btn ghost small" id="lang">${esc(t('lang_toggle'))}</button>
      <div class="user"><span class="user-name">${esc(p.full_name || p.email)}</span>
        <span class="user-role">${esc(en('role', p.role))}${p.school_id ? ' · ' + esc(state.ref.school[p.school_id] ? (state.lang === 'ar' ? state.ref.school[p.school_id].name_ar : state.ref.school[p.school_id].name_en) : '') : ''}</span></div>
      <button class="btn ghost small" id="out">${esc(t('sign_out'))}</button>
    </div>
  </header>
  <div class="shell">
    <nav class="sidenav" id="nav">${nav.map(([k, r]) => `<a href="#/${k}" data-route="${k}"><span class="ico">${r.icon}</span>${esc(t(r.nav))}</a>`).join('')}</nav>
    <main id="view" class="view"></main>
  </div>`;
  document.getElementById('lang').onclick = () => { setLang(state.lang === 'en' ? 'ar' : 'en'); render(); };
  document.getElementById('out').onclick = async () => { await auth.signOut(); location.hash = ''; boot(); };
  document.getElementById('menu').onclick = () => document.getElementById('nav').classList.toggle('open');
}

let renderSeq = 0;
async function route() {
  const view = document.getElementById('view');
  if (!view) return;
  const { name, id, params } = parseHash();
  const r = ROUTES[name] && can(ROUTES[name].perm) ? ROUTES[name] : ROUTES.dashboard;
  const key = ROUTES[name] ? name : 'dashboard';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active',
    a.dataset.route === key || (key === 'candidate' && a.dataset.route === 'candidates') || (key === 'interview' && a.dataset.route === 'interviews')));
  document.getElementById('nav').classList.remove('open');
  const seq = ++renderSeq;
  view.innerHTML = `<div class="loading">${esc(t('loading'))}</div>`;
  try {
    const mod = await import(r.mod);
    if (seq !== renderSeq) return;
    await mod.render(view, { id, params, seq: () => seq === renderSeq });
  } catch (e) {
    if (seq === renderSeq) view.innerHTML = `<div class="notice err">${esc(e.message || e)}</div>`;
    console.error(e);
  }
  window.scrollTo(0, 0);
}

export function render() {
  if (!configured) { authShell(`<div class="notice err">${esc(t('not_configured'))}</div>`); return; }
  if (!state.session) return signInView();
  if (!state.profile || state.profile.status !== 'approved' || role() === 'none') return pendingView();
  layout();
  route();
}

async function boot() {
  setLang(state.lang);
  if (!configured) return render();
  if (location.hash.includes('type=recovery')) { await auth.session(); return recoveryView(); }
  try {
    state.session = await auth.session();
    state.profile = null;
    if (state.session) {
      state.profile = await db.get('profiles', state.session.user.id);
      if (state.profile && state.profile.status === 'approved') await loadRef();
    }
  } catch (e) { fail(e); }
  render();
}

window.addEventListener('hashchange', () => { if (document.getElementById('view')) route(); });
if (configured) auth.onChange((event) => { if (event === 'PASSWORD_RECOVERY') setTimeout(recoveryView, 0); });
boot();
