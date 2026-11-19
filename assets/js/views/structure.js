// Vacancies: approved structure vs staff vs selected candidates, per school and title
import { db } from '../api.js';
import { state, t, esc, num, nm, can, lockedSchool, visibleSchools, schoolName, titleName, vacancyBadge, modal, toast,
  readForm, exportXlsx, stageBadge, ratingBadge, en, yearLabel } from '../core.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const locked = lockedSchool();
  let school = locked || ctx.params.school || 'all';
  if (locked) school = String(locked);

  let [pos, plan, positions] = await Promise.all([
    db.list('v_position_status', { eq: { school_id: locked || undefined } }),
    db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
    can('admin') ? db.list('school_positions') : Promise.resolve([]),
  ]);
  if (!ctx.seq()) return;
  const years = ref.planYears;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('nav_structure'))}</h2><p>${esc(t('structure_hint'))}</p></div>
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div>
    <div class="tabs" id="tabs">
      ${locked ? '' : `<button data-s="all">${esc(t('all_schools'))}</button>`}
      ${visibleSchools().map(s => `<button data-s="${s.id}">${esc(nm(s))}</button>`).join('')}
    </div>
    <div id="body"></div>`;
  const tabs = el.querySelectorAll('#tabs button');
  tabs.forEach(b => b.onclick = () => { school = b.dataset.s; draw(); });
  let exportRows = [];
  el.querySelector('#xl').onclick = () => exportXlsx([{ name: school === 'all' ? t('all_schools') : schoolName(Number(school)), rows: exportRows }], 'vacancies');

  function draw() {
    tabs.forEach(b => b.classList.toggle('active', b.dataset.s === String(school)));
    const body = el.querySelector('#body');
    exportRows = [];
    if (school === 'all') {
      // matrix: title × school (remaining), plus totals
      const schools = ref.schools;
      let html = `<div class="table-wrap"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
        <th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('remaining'))}</th>${schools.map(s => `<th class="n" title="${esc(nm(s))}">${esc(nm(s))}<span class="cell-sub">${esc(t('remaining'))}</span></th>`).join('')}</tr></thead><tbody>`;
      const tot = { a: 0, c: 0, s: 0, r: 0, per: {} };
      for (const d of ref.departments) {
        const titles = ref.titles.filter(x => x.department_id === d.id);
        html += `<tr class="group"><td colspan="${5 + schools.length}">${esc(nm(d))}</td></tr>`;
        for (const ti of titles) {
          const rows = pos.filter(r => r.job_title_id === ti.id);
          if (!rows.length) continue;
          const a = rows.reduce((x, r) => x + r.approved_count, 0), c = rows.reduce((x, r) => x + r.current_staff, 0),
            s = rows.reduce((x, r) => x + r.selected, 0), rem = rows.reduce((x, r) => x + r.remaining, 0);
          tot.a += a; tot.c += c; tot.s += s; tot.r += Math.max(0, rem);
          const per = schools.map(sc => rows.find(r => r.school_id === sc.id));
          per.forEach((r, i) => { tot.per[i] = (tot.per[i] || 0) + Math.max(0, r?.remaining || 0); });
          html += `<tr><td>${esc(nm(ti))}</td><td class="n">${num(a)}</td><td class="n">${num(c)}</td><td class="n">${num(s)}</td>
            <td class="n ${cls(rem)}">${num(rem)}</td>${per.map(r => `<td class="n ${r ? cls(r.remaining) : ''}">${r ? num(r.remaining) : '–'}</td>`).join('')}</tr>`;
          const row = { [t('department')]: nm(d), [t('job_title')]: nm(ti), [t('approved')]: a, [t('current_staff')]: c, [t('selected')]: s, [t('remaining')]: rem };
          schools.forEach((sc, i) => { row[nm(sc)] = per[i] ? per[i].remaining : ''; });
          exportRows.push(row);
        }
      }
      html += `</tbody><tfoot><tr><td>${esc(t('total'))}</td><td class="n">${num(tot.a)}</td><td class="n">${num(tot.c)}</td><td class="n">${num(tot.s)}</td><td class="n">${num(tot.r)}</td>
        ${schools.map((s, i) => `<td class="n">${num(tot.per[i] || 0)}</td>`).join('')}</tr></tfoot></table></div>
        <p class="muted">${esc(t('remaining'))}: ${state.lang === 'ar' ? 'الأرقام السالبة تعني زيادة عن المعتمد' : 'negative numbers mean staffing above the approved count'}.</p>`;
      body.innerHTML = html;
      return;
    }

    const sid = Number(school);
    const rows = pos.filter(r => r.school_id === sid);
    const yp = (tid, yid) => plan.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid);
    let html = `<div class="table-wrap"><table><thead><tr><th>${esc(t('job_title'))}</th><th>${esc(t('reports_to'))}</th>
      <th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th><th class="n">${esc(t('selected'))}</th>
      <th class="n">${esc(t('hired'))}</th><th class="n">${esc(t('joined'))}</th><th class="n">${esc(t('remaining'))}</th><th>${esc(t('vacancy_status'))}</th>
      ${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('selected'))} / ${esc(t('planned'))}</span></th>`).join('')}
      ${can('admin') ? '<th></th>' : ''}</tr></thead><tbody>`;
    const tot = { a: 0, c: 0, s: 0, h: 0, j: 0, r: 0, y: {} };
    for (const d of ref.departments) {
      const drows = rows.filter(r => r.department_id === d.id).sort((a, b) => ref.title[a.job_title_id].sort - ref.title[b.job_title_id].sort);
      if (!drows.length) continue;
      html += `<tr class="group"><td colspan="${9 + years.length + (can('admin') ? 1 : 0)}">${esc(nm(d))}</td></tr>`;
      for (const r of drows) {
        const ti = ref.title[r.job_title_id];
        tot.a += r.approved_count; tot.c += r.current_staff; tot.s += r.selected; tot.h += r.hired; tot.j += r.joined; tot.r += Math.max(0, r.remaining);
        const ycells = years.map(y => {
          const p = yp(r.job_title_id, y.id);
          const pl = p.reduce((a, x) => a + x.planned, 0), se = p.reduce((a, x) => a + x.selected, 0);
          tot.y[y.id] = tot.y[y.id] || { pl: 0, se: 0 }; tot.y[y.id].pl += pl; tot.y[y.id].se += se;
          return `<td class="n">${pl || se ? `${num(se)} / ${num(pl)}` : '<span class="muted">–</span>'}</td>`;
        }).join('');
        html += `<tr class="clickable" data-t="${r.job_title_id}"><td>${esc(nm(ti))}</td><td><small>${esc(state.lang === 'ar' ? ti.reports_to_ar || '' : ti.reports_to_en || '')}</small></td>
          <td class="n">${num(r.approved_count)}</td><td class="n">${num(r.current_staff)}</td><td class="n">${num(r.selected)}</td>
          <td class="n">${num(r.hired)}</td><td class="n">${num(r.joined)}</td><td class="n ${cls(r.remaining)}">${num(r.remaining)}</td><td>${vacancyBadge(r.remaining)}</td>
          ${ycells}${can('admin') ? `<td><button class="btn small" data-edit="${r.job_title_id}">${esc(t('edit'))}</button></td>` : ''}</tr>`;
        const row = { [t('department')]: nm(d), [t('job_title')]: nm(ti), [t('approved')]: r.approved_count, [t('current_staff')]: r.current_staff,
          [t('selected')]: r.selected, [t('hired')]: r.hired, [t('joined')]: r.joined, [t('remaining')]: r.remaining };
        years.forEach(y => { const p = yp(r.job_title_id, y.id); row[`${t('planned')} ${y.label}`] = p.reduce((a, x) => a + x.planned, 0); row[`${t('selected')} ${y.label}`] = p.reduce((a, x) => a + x.selected, 0); });
        exportRows.push(row);
      }
    }
    html += `</tbody><tfoot><tr><td colspan="2">${esc(t('total'))}</td><td class="n">${num(tot.a)}</td><td class="n">${num(tot.c)}</td><td class="n">${num(tot.s)}</td>
      <td class="n">${num(tot.h)}</td><td class="n">${num(tot.j)}</td><td class="n">${num(tot.r)}</td><td></td>
      ${years.map(y => `<td class="n">${num(tot.y[y.id]?.se || 0)} / ${num(tot.y[y.id]?.pl || 0)}</td>`).join('')}${can('admin') ? '<td></td>' : ''}</tr></tfoot></table></div>`;
    body.innerHTML = html;

    body.querySelectorAll('tr[data-t]').forEach(tr => tr.onclick = (e) => {
      if (e.target.closest('[data-edit]')) return;
      showCandidates(sid, Number(tr.dataset.t));
    });
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editCounts(sid, Number(b.dataset.edit)));
  }

  async function showCandidates(sid, tid) {
    const list = await db.list('candidates', { eq: { school_id: sid, job_title_id: tid }, order: [['full_name']] });
    modal({
      title: `${t('candidates_for')} ${titleName(tid)} — ${schoolName(sid)}`, wide: true,
      body: list.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('full_name'))}</th><th>${esc(t('specialization'))}</th><th>${esc(t('year'))}</th>
          <th>${esc(t('rating'))}</th><th>${esc(t('stage'))}</th></tr></thead><tbody>
          ${list.map(c => `<tr class="clickable" onclick="location.hash='#/candidate/${c.id}';document.querySelector('.modal-wrap').remove()">
            <td>${esc(c.full_name)}</td><td>${esc(c.specialization || '')}</td><td>${esc(yearLabel(c.year_id))}</td><td>${ratingBadge(c.last_score)}</td><td>${stageBadge(c.stage)}</td></tr>`).join('')}
          </tbody></table></div>` : `<div class="empty">${esc(t('no_records'))}</div>`,
    });
  }

  function editCounts(sid, tid) {
    const p = positions.find(x => x.school_id === sid && x.job_title_id === tid);
    modal({
      title: `${t('edit_structure')}: ${titleName(tid)} — ${schoolName(sid)}`,
      body: `<div class="form"><div class="grid2">
        <label>${esc(t('approved'))}<input name="approved_count" type="number" min="0" data-type="int" value="${p?.approved_count ?? 0}"></label>
        <label>${esc(t('current_staff'))}<input name="current_staff" type="number" min="0" data-type="int" value="${p?.current_staff ?? 0}"></label></div>
        <label>${esc(t('notes'))}<textarea name="notes">${esc(p?.notes || '')}</textarea></label></div>`,
      onSave: async (m) => {
        const v = readForm(m);
        const saved = await db.upsert('school_positions', [{ ...(p ? { id: p.id } : {}), school_id: sid, job_title_id: tid, ...v, updated_at: new Date().toISOString() }], 'school_id,job_title_id');
        positions = positions.filter(x => !(x.school_id === sid && x.job_title_id === tid)).concat(saved);
        pos = await db.list('v_position_status', { eq: { school_id: locked || undefined } });
        toast(t('saved')); draw();
      },
    });
  }
  draw();
}

const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero');
export { en };
