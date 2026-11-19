import { db } from '../api.js';
import { state, t, en, esc, num, fmtDate, options, titleOptions, enumOptions, can, visibleSchools, schoolName, titleName,
  ratingBadge, resultBadge, exportXlsx, specLabel } from '../core.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const f = { from: '', to: '', title: '', src: '', mode: '', result: '', rating: '', school: '', q: '', ...ctx.params };
  const [ints, cands] = await Promise.all([
    db.list('interviews', { order: [['interview_date', false], ['created_at', false]] }),
    db.list('candidates', { select: 'id,full_name,ref_no,nationality,school_id,specialization' }),
  ]);
  if (!ctx.seq()) return;
  const cand = Object.fromEntries(cands.map(c => [c.id, c]));

  el.innerHTML = `
    <div class="page-head"><h2>${esc(t('interview_list'))}</h2>
      <div class="row">${can('interview') ? `<a class="btn primary" href="#/interview/new">＋ ${esc(t('new_interview'))}</a>` : ''}
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div></div>
    <div class="toolbar" id="flt">
      <label class="wide">${esc(t('search'))}<input name="q" value="${esc(f.q)}"></label>
      <label>${esc(t('from'))}<input type="date" name="from" value="${esc(f.from)}"></label>
      <label>${esc(t('to'))}<input type="date" name="to" value="${esc(f.to)}"></label>
      <label>${esc(t('job_title'))}<select name="title">${titleOptions(f.title, t('all'))}</select></label>
      <label>${esc(t('recommended_school'))}<select name="school">${options(visibleSchools(), f.school, { empty: t('all') })}</select></label>
      <label>${esc(t('source'))}<select name="src">${enumOptions('cv_source', f.src, t('all'))}</select></label>
      <label>${esc(t('mode'))}<select name="mode">${enumOptions('mode', f.mode, t('all'))}</select></label>
      <label>${esc(t('interview_result'))}<select name="result">${enumOptions('result', f.result, t('all'))}</select></label>
      <label>${esc(t('rating'))}<select name="rating">${enumOptions('rating', f.rating, t('all'))}</select></label>
    </div><p class="muted" id="cnt"></p><div id="list"></div>`;
  el.querySelectorAll('#flt [name]').forEach(i => i.addEventListener(i.tagName === 'INPUT' && i.type !== 'date' ? 'input' : 'change', () => { f[i.name] = i.value; draw(); }));
  let rows = [];
  el.querySelector('#xl').onclick = () => {
    exportXlsx([{ name: t('interview_list'), rows: rows.map(i => {
      const c = cand[i.candidate_id] || {};
      const base = { [t('date')]: i.interview_date, [t('full_name')]: c.full_name, [t('nationality')]: c.nationality || '', [t('job_title')]: titleName(i.job_title_id), [t('specialization')]: specLabel(i.specialization || c.specialization),
        [t('source')]: en('cv_source', i.source), [t('source_detail')]: i.source_detail || '', [t('mode')]: en('mode', i.mode), [t('interviewers')]: i.interviewers || '',
        [t('recommended_school')]: schoolName(i.school_id), [t('computed_score')]: i.computed_score ?? '', [t('overall_score')]: i.overall_score ?? '',
        [t('rating')]: en('rating', i.rating), [t('interview_result')]: en('result', i.result), [t('strengths')]: i.strengths || '', [t('weaknesses')]: i.weaknesses || '', [t('notes')]: i.notes || '' };
      // criteria scores as extra columns
      const crit = ref.criteria.filter(x => x.rubric_key === i.rubric_key || x.job_title_id === i.job_title_id);
      crit.forEach(x => { if (i.scores[x.key] !== undefined) base[(state.lang === 'ar' ? x.name_ar : x.name_en)] = i.scores[x.key]; });
      return base;
    }) }], 'interviews');
  };

  function draw() {
    const q = f.q.trim().toLowerCase();
    rows = ints.filter(i => {
      const c = cand[i.candidate_id] || {};
      return (!q || (c.full_name || '').toLowerCase().includes(q) || (i.interviewers || '').toLowerCase().includes(q)) &&
        (!f.from || i.interview_date >= f.from) && (!f.to || i.interview_date <= f.to) &&
        (!f.title || String(i.job_title_id) === f.title) && (!f.school || String(i.school_id) === f.school) &&
        (!f.src || i.source === f.src) && (!f.mode || i.mode === f.mode) && (!f.result || i.result === f.result) && (!f.rating || i.rating === f.rating);
    });
    el.querySelector('#cnt').textContent = `${num(rows.length)} ${t('count_records')}`;
    el.querySelector('#list').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('date'))}</th><th>${esc(t('candidate'))}</th>
      <th>${esc(t('job_title'))}</th><th>${esc(t('source'))}</th><th>${esc(t('interviewers'))}</th><th>${esc(t('rating'))}</th><th>${esc(t('interview_result'))}</th></tr></thead>
      <tbody>${rows.map(i => { const c = cand[i.candidate_id] || {}; return `<tr class="clickable" data-id="${i.id}"><td>${fmtDate(i.interview_date)}</td>
        <td><b>${esc(c.full_name || '')}</b><span class="cell-sub">${esc(c.nationality || '')}</span></td><td>${esc(titleName(i.job_title_id))}${(i.specialization || c.specialization) ? `<span class="cell-sub">${esc(specLabel(i.specialization || c.specialization))}</span>` : ''}</td>
        <td>${esc(en('cv_source', i.source))}${i.mode ? `<span class="cell-sub">${esc(en('mode', i.mode))}</span>` : ''}</td>
        <td><small>${esc(i.interviewers || '')}</small></td><td>${ratingBadge(i.overall_score, i.rating)}</td><td>${resultBadge(i.result)}</td></tr>`; }).join('')}</tbody></table></div>`
      : `<div class="empty card">${esc(t('no_records'))}</div>`;
    el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = `#/interview/${tr.dataset.id}`; });
  }
  draw();
}
