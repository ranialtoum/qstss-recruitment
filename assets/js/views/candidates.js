import { db } from '../api.js';
import { state, t, esc, num, options, titleOptions, enumOptions, can, lockedSchool, visibleSchools, schoolName, titleName,
  yearLabel, stageBadge, ratingBadge, en, exportXlsx, candidateRow } from '../core.js';
import { ratingFor } from '../i18n.js';
import { openCandidateForm } from './candidate_form.js';

const KEY = 'qstss_rec_cand_filters';

export async function render(el, ctx) {
  const ref = state.ref;
  const saved = JSON.parse(sessionStorage.getItem(KEY) || '{}');
  const f = { q: '', school: '', title: '', dept: '', stage: '', nat: '', src: '', year: '', rating: '', inside: '', ...saved, ...ctx.params };
  const all = await db.list('candidates', { order: [['created_at', false]] });
  if (!ctx.seq()) return;
  const nats = [...new Set(all.map(c => c.nationality).filter(Boolean))].sort();

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('candidates'))}</h2></div>
      <div class="row">${can('interview') ? `<button class="btn" id="add">＋ ${esc(t('new_candidate'))}</button>
        <a class="btn primary" href="#/interview/new">＋ ${esc(t('new_interview'))}</a>` : ''}
        <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div></div>
    <div class="toolbar" id="flt">
      <label class="wide">${esc(t('search'))}<input name="q" value="${esc(f.q)}" placeholder="${esc(t('search_candidate'))}"></label>
      <label>${esc(t('school'))}<select name="school" ${lockedSchool() ? 'disabled' : ''}>${options(visibleSchools(), f.school, { empty: t('all') })}<option value="none" ${f.school === 'none' ? 'selected' : ''}>— ${esc(t('not_set'))}</option></select></label>
      <label>${esc(t('department'))}<select name="dept">${options(ref.departments, f.dept, { empty: t('all') })}</select></label>
      <label>${esc(t('job_title'))}<select name="title">${titleOptions(f.title, t('all'))}</select></label>
      <label>${esc(t('stage'))}<select name="stage">${enumOptions('stage', f.stage, t('all'))}</select></label>
      <label>${esc(t('rating'))}<select name="rating">${enumOptions('rating', f.rating, t('all'))}</select></label>
      <label>${esc(t('nationality'))}<select name="nat">${options(nats.map(n => ({ id: n, n })), f.nat, { empty: t('all'), label: o => o.n })}</select></label>
      <label>${esc(t('cv_source'))}<select name="src">${enumOptions('cv_source', f.src, t('all'))}</select></label>
      <label>${esc(t('year'))}<select name="year">${options(ref.planYears, f.year, { empty: t('all'), label: y => y.label })}</select></label>
      <label>${esc(t('inside_qatar'))}<select name="inside">${enumOptions('inside_qatar', f.inside, t('all'))}</select></label>
      <button class="btn ghost" id="clr">${esc(t('clear'))}</button>
    </div>
    <div class="row-between" style="margin-bottom:.5rem"><span class="muted" id="cnt"></span></div>
    <div id="list"></div>`;

  const flt = el.querySelector('#flt');
  flt.querySelectorAll('[name]').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'change', () => { f[i.name] = i.value; draw(); }));
  el.querySelector('#clr').onclick = () => { sessionStorage.removeItem(KEY); render(el, { ...ctx, params: {} }); };
  if (can('interview')) el.querySelector('#add').onclick = () => openCandidateForm(null, (c) => { location.hash = `#/candidate/${c.id}`; });
  let filtered = [];
  el.querySelector('#xl').onclick = () => exportXlsx([{ name: t('candidates'), rows: filtered.map(candidateRow) }], 'candidates');

  function draw() {
    sessionStorage.setItem(KEY, JSON.stringify(f));
    const q = f.q.trim().toLowerCase();
    filtered = all.filter(c =>
      (!q || [c.full_name, c.email, c.phone, c.specialization, String(c.ref_no)].some(x => (x || '').toLowerCase().includes(q))) &&
      (!f.school || (f.school === 'none' ? !c.school_id : String(c.school_id) === f.school)) &&
      (!f.title || String(c.job_title_id) === f.title) &&
      (!f.dept || (c.job_title_id && String(ref.title[c.job_title_id]?.department_id) === f.dept)) &&
      (!f.stage || c.stage === f.stage) && (!f.nat || c.nationality === f.nat) && (!f.src || c.cv_source === f.src) &&
      (!f.year || String(c.year_id) === f.year) && (!f.rating || ratingFor(c.last_score) === f.rating) &&
      (!f.inside || String(c.inside_qatar) === f.inside));
    el.querySelector('#cnt').textContent = `${num(filtered.length)} ${t('count_records')}`;
    el.querySelector('#list').innerHTML = filtered.length ? `<div class="table-wrap"><table><thead><tr>
      <th>${esc(t('ref_no'))}</th><th>${esc(t('full_name'))}</th><th>${esc(t('job_title'))}</th><th>${esc(t('school'))}</th>
      <th>${esc(t('nationality'))}</th><th>${esc(t('cv_source'))}</th><th>${esc(t('rating'))}</th><th>${esc(t('stage'))}</th><th>${esc(t('year'))}</th></tr></thead>
      <tbody>${filtered.slice(0, 500).map(c => `<tr class="clickable" data-id="${c.id}">
        <td class="muted">${c.ref_no}</td><td><b>${esc(c.full_name)}</b>${c.specialization ? `<span class="cell-sub">${esc(c.specialization)}</span>` : ''}</td>
        <td>${esc(titleName(c.job_title_id))}</td><td>${esc(schoolName(c.school_id))}</td><td>${esc(c.nationality || '')}</td>
        <td>${esc(en('cv_source', c.cv_source))}</td><td>${ratingBadge(c.last_score)}</td><td>${stageBadge(c.stage)}</td><td>${esc(yearLabel(c.year_id))}</td></tr>`).join('')}
      </tbody></table></div>${filtered.length > 500 ? `<p class="muted">… ${num(filtered.length - 500)} ${esc(t('count_records'))} (${esc(t('export_excel'))})</p>` : ''}`
      : `<div class="empty card">${esc(t('no_records'))}</div>`;
    el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = `#/candidate/${tr.dataset.id}`; });
  }
  draw();
}
