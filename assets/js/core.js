// Shared state & helpers used by every view
import { DICT, ENUMS, ratingFor } from './i18n.js';
import { db } from './api.js';

export const state = {
  lang: localStorage.getItem('qstss_rec_lang') || 'en',
  session: null,
  profile: null,
  ref: null,
};

// ---------- text ----------
export const t = (k) => (DICT[state.lang] && DICT[state.lang][k]) ?? DICT.en[k] ?? k;
export function en(group, val) {
  if (val === null || val === undefined || val === '') return '';
  const m = ENUMS[group] && ENUMS[group][String(val)];
  return m ? m[state.lang === 'ar' ? 1 : 0] : String(val);
}
export const nm = (o) => (o ? (state.lang === 'ar' ? (o.name_ar || o.name_en) : (o.name_en || o.name_ar)) : '');
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const num = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString(state.lang === 'ar' ? 'ar-QA-u-nu-latn' : 'en-GB'));
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(state.lang === 'ar' ? 'ar-QA-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
export const today = () => new Date().toISOString().slice(0, 10);

export function setLang(l) {
  state.lang = l;
  localStorage.setItem('qstss_rec_lang', l);
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
}

// ---------- permissions ----------
export const role = () => (state.profile && state.profile.status === 'approved' ? state.profile.role : 'none');
export function can(what) {
  const r = role();
  return {
    admin: r === 'admin',
    manage: ['admin', 'hr'].includes(r),
    interview: ['admin', 'hr', 'interviewer'].includes(r),
    onboarding: ['admin', 'hr', 'principal'].includes(r),
    read: r !== 'none',
  }[what];
}
export const lockedSchool = () => (role() === 'principal' ? state.profile.school_id : null);

// ---------- reference data ----------
export async function loadRef() {
  const [schools, departments, titles, years, rubrics, criteria, labs] = await Promise.all([
    db.list('schools', { order: [['sort'], ['id']] }),
    db.list('departments', { order: [['sort']] }),
    db.list('job_titles', { order: [['sort'], ['id']] }),
    db.list('academic_years', { order: [['start_year']] }),
    db.list('rubrics', { order: [['sort']] }),
    db.list('rubric_criteria', { order: [['sort'], ['id']] }),
    db.list('school_labs', { order: [['school_id'], ['name']] }),
  ]);
  const byId = (a) => Object.fromEntries(a.map(x => [x.id, x]));
  state.ref = {
    schools, departments, titles, years, rubrics, criteria, labs,
    school: byId(schools), dept: byId(departments), title: byId(titles), yearById: byId(years),
    rubric: Object.fromEntries(rubrics.map(r => [r.key, r])),
    planYears: years.filter(y => !y.is_baseline),
    currentYear: years.find(y => y.is_current) || years.find(y => !y.is_baseline) || years[0],
  };
}
export const schoolName = (id) => nm(state.ref.school[id]) || '';
export const titleName = (id) => nm(state.ref.title[id]) || '';
export const deptName = (id) => nm(state.ref.dept[id]) || '';
export const yearLabel = (id) => (state.ref.yearById[id] || {}).label || '';
export const visibleSchools = () => (lockedSchool() ? state.ref.schools.filter(s => s.id === lockedSchool()) : state.ref.schools);

// ---------- html snippets ----------
export function options(list, selected, { empty = null, value = 'id', label = nm } = {}) {
  let html = empty !== null ? `<option value="">${esc(empty)}</option>` : '';
  for (const o of list) {
    const v = typeof value === 'function' ? value(o) : o[value];
    html += `<option value="${esc(v)}" ${String(v) === String(selected ?? '') ? 'selected' : ''}>${esc(label(o))}</option>`;
  }
  return html;
}
export function enumOptions(group, selected, empty = '') {
  const keys = Object.keys(ENUMS[group]);
  return (empty !== null ? `<option value="">${esc(empty)}</option>` : '') +
    keys.map(k => `<option value="${k}" ${String(selected ?? '') === k ? 'selected' : ''}>${esc(en(group, k))}</option>`).join('');
}
export function titleOptions(selected, empty = '') {
  // grouped by department
  let html = empty !== null ? `<option value="">${esc(empty)}</option>` : '';
  for (const d of state.ref.departments) {
    const ts = state.ref.titles.filter(x => x.department_id === d.id && x.active !== false);
    if (!ts.length) continue;
    html += `<optgroup label="${esc(nm(d))}">${options(ts, selected)}</optgroup>`;
  }
  return html;
}

const STAGE_TONE = {
  new: 'grey', accepted: 'blue', reserve: 'amber', rejected: 'red', offer_sent: 'blue', offer_accepted: 'teal',
  offer_declined: 'red', documents_complete: 'teal', hired: 'green', not_hired: 'red', started: 'green',
  probation_passed: 'green', probation_failed: 'red', confirmed: 'dkgreen', resigned: 'red', withdrawn: 'grey',
};
export const stageBadge = (s) => s ? `<span class="badge tone-${STAGE_TONE[s] || 'grey'}">${esc(en('stage', s))}</span>` : '';
export const resultBadge = (r) => r ? `<span class="badge tone-${{ accepted: 'green', rejected: 'red', reserve: 'amber', pending: 'grey' }[r]}">${esc(en('result', r))}</span>` : '';
export function ratingBadge(score, rating) {
  const r = rating || ratingFor(score);
  if (!r) return '';
  return `<span class="rating rating-${r}">${score !== null && score !== undefined && score !== '' ? `<b>${esc(Math.round(score))}</b>` : ''}${esc(en('rating', r))}</span>`;
}
export function vacancyBadge(remaining) {
  if (remaining > 0) return `<span class="badge tone-amber">${esc(t('vac_open'))} ${num(remaining)}</span>`;
  if (remaining < 0) return `<span class="badge tone-red">${esc(t('vac_over'))} ${num(-remaining)}</span>`;
  return `<span class="badge tone-green">${esc(t('vac_filled'))}</span>`;
}
export function bar(value, max, tone = '') {
  const p = Math.max(0, Math.min(100, pct(value, max)));
  return `<div class="meter ${tone}" title="${p}%"><span style="width:${p}%"></span></div>`;
}

// ---------- feedback ----------
export function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, type === 'err' ? 6000 : 2800);
}
export const fail = (e) => { console.error(e); toast(`${t('error')}: ${e.message || e}`, 'err'); };

export function modal({ title, body, onSave, saveLabel, wide = false, onOpen }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <header><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="${esc(t('close'))}">✕</button></header>
      <div class="modal-body">${body}</div>
      <footer>${onSave ? `<button class="btn primary" data-save>${esc(saveLabel || t('save'))}</button>` : ''}
      <button class="btn" data-x>${esc(onSave ? t('cancel') : t('close'))}</button></footer></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelectorAll('[data-x]').forEach(b => b.onclick = close);
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  if (onSave) {
    const btn = wrap.querySelector('[data-save]');
    btn.onclick = async () => {
      btn.disabled = true;
      try { if ((await onSave(wrap)) !== false) close(); } catch (e) { fail(e); } finally { btn.disabled = false; }
    };
  }
  if (onOpen) onOpen(wrap);
  const first = wrap.querySelector('input,select,textarea');
  if (first) first.focus();
  return { el: wrap, close };
}

// Read <form> fields: data-type="int|num|bool" control conversion; empty → null
export function readForm(root) {
  const out = {};
  root.querySelectorAll('[name]').forEach(f => {
    if (f.disabled) return;
    let v = f.type === 'checkbox' ? f.checked : f.value.trim();
    const type = f.dataset.type;
    if (f.type !== 'checkbox' && v === '') v = null;
    else if (type === 'int') v = parseInt(v, 10);
    else if (type === 'num') v = Number(v);
    else if (type === 'bool' && f.type !== 'checkbox') v = v === 'true';
    out[f.name] = v;
  });
  return out;
}
export function validate(root) {
  let ok = true;
  root.querySelectorAll('[required]').forEach(f => {
    const bad = !String(f.value || '').trim();
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) toast(t('required'), 'err');
  return ok;
}

// ---------- Excel export ----------
export function exportXlsx(sheets, filename) {
  const wb = window.XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = window.XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{}]);
    if (state.lang === 'ar') ws['!views'] = [{ RTL: true }];
    ws['!cols'] = Object.keys(s.rows[0] || {}).map(k => ({ wch: Math.min(40, Math.max(10, String(k).length + 2)) }));
    window.XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '));
  }
  window.XLSX.writeFile(wb, `${filename}_${today()}.xlsx`);
}

// candidate → flat row for exports (column names in the current language)
export function candidateRow(c) {
  return {
    [t('ref_no')]: c.ref_no, [t('full_name')]: c.full_name, [t('cv_source')]: en('cv_source', c.cv_source),
    [t('cv_source_detail')]: c.cv_source_detail || '', [t('specialization')]: c.specialization || '',
    [t('job_title')]: titleName(c.job_title_id), [t('department')]: c.job_title_id ? deptName(state.ref.title[c.job_title_id]?.department_id) : '',
    [t('school')]: schoolName(c.school_id), [t('year')]: yearLabel(c.year_id), [t('gender')]: en('gender', c.gender),
    [t('nationality')]: c.nationality || '', [t('email_addr')]: c.email || '', [t('phone')]: c.phone || '',
    [t('inside_qatar')]: c.inside_qatar === null || c.inside_qatar === undefined ? '' : en('inside_qatar', c.inside_qatar),
    [t('residence_country')]: c.residence_country || '', [t('visa_status')]: en('visa_status', c.visa_status),
    [t('marital_status')]: en('marital_status', c.marital_status), [t('sons')]: c.sons, [t('daughters')]: c.daughters,
    [t('total_children')]: c.total_children, [t('qualification')]: c.qualification || '', [t('years_experience')]: c.years_experience ?? '',
    [t('result')]: en('result', c.interview_result), [t('last_score')]: c.last_score ?? '', [t('rating')]: en('rating', ratingFor(c.last_score)),
    [t('stage')]: en('stage', c.stage), [t('notes')]: c.notes || '',
  };
}

// Simple chart helper (Chart.js). Palette: validated categorical slots (see README → design notes)
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a'];
const charts = new WeakMap();
export function chart(canvas, config) {
  if (!canvas || !window.Chart) return;
  if (charts.get(canvas)) charts.get(canvas).destroy();
  const css = getComputedStyle(document.documentElement);
  window.Chart.defaults.font.family = css.getPropertyValue('--font').trim();
  window.Chart.defaults.color = css.getPropertyValue('--ink-2').trim();
  window.Chart.defaults.borderColor = css.getPropertyValue('--line').trim();
  if (state.lang === 'ar') {
    const o = config.options = config.options || {};
    o.plugins = o.plugins || {}; o.plugins.legend = { ...(o.plugins.legend || {}), rtl: true };
    o.plugins.tooltip = { ...(o.plugins.tooltip || {}), rtl: true };
    if (o.scales && o.scales.x) o.scales.x.reverse = true;   // mirror for right-to-left reading
    if (o.indexAxis === 'y' && o.scales && o.scales.y) o.scales.y.position = 'right';
  }
  const c = new window.Chart(canvas, config);
  charts.set(canvas, c);
  return c;
}
