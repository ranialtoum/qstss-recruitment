// Vacancies: approved structure vs staff vs selected candidates, per school and title
import { db } from '../api.js';
import { state, t, esc, num, nm, can, lockedSchool, visibleSchools, schoolName, titleName, vacancyBadge, modal, toast,
  readForm, exportXlsx, stageBadge, ratingBadge, en, yearLabel, specLabel, labOptions, loadRef, fail } from '../core.js';
import { labRows, perLabTitles, schoolLabs } from './labs.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const locked = lockedSchool();
  let school = locked || ctx.params.school || 'all';
  if (locked) school = String(locked);

  const labTitleIds = perLabTitles().map(x => x.id);
  let [pos, plan, positions, labCands] = await Promise.all([
    db.list('v_position_status', { eq: { school_id: locked || undefined } }),
    db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
    can('admin') ? db.list('school_positions') : Promise.resolve([]),
    labTitleIds.length ? db.list('candidates', { select: 'school_id,job_title_id,specialization,stage', in: { job_title_id: labTitleIds } }) : Promise.resolve([]),
  ]);
  // lab rows for one school × per-lab title
  const breakdown = (sid, tid) => labRows(sid, pos.find(r => r.school_id === sid && r.job_title_id === tid),
    labCands.filter(c => c.school_id === sid && c.job_title_id === tid), plan.filter(p => p.school_id === sid && p.job_title_id === tid), years);
  const labName = (r) => (r.unassigned ? t('lab_unassigned') : specLabel(r.name));
  if (!ctx.seq()) return;
  const years = ref.planYears;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('nav_structure'))}</h2><p>${esc(t('structure_hint'))}</p></div>
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div>
    <div class="tabs" id="tabs">
      ${locked ? '' : `<button data-s="all">${esc(t('all_schools'))}</button>`}
      ${visibleSchools().map(s => `<button data-s="${s.id}">${esc(nm(s))}</button>`).join('')}
    </div>
    <div class="toolbar" id="ybar" hidden>
      <label>${esc(t('year'))}<select id="fy"><option value="">${esc(t('overall_structure'))}</option>
        ${years.map(y => `<option value="${y.id}">${esc(y.label)}</option>`).join('')}</select></label>
    </div>
    <div id="body"></div>`;
  const tabs = el.querySelectorAll('#tabs button');
  tabs.forEach(b => b.onclick = () => { school = b.dataset.s; draw(); });
  let yearId = ctx.params.year && years.some(y => String(y.id) === ctx.params.year) ? Number(ctx.params.year) : null;
  const fy = el.querySelector('#fy');
  fy.value = yearId ? String(yearId) : '';
  fy.onchange = () => { yearId = fy.value ? Number(fy.value) : null; draw(); };
  let exportRows = [];
  el.querySelector('#xl').onclick = () => exportXlsx([{ name: school === 'all' ? (yearId ? `${t('all_schools')} ${ref.yearById[yearId].label}`.replace(/[\\/?*[\]:]/g, '-') : t('all_schools')) : schoolName(Number(school)), rows: exportRows }], 'vacancies');

  function draw() {
    tabs.forEach(b => b.classList.toggle('active', b.dataset.s === String(school)));
    el.querySelector('#ybar').hidden = school !== 'all';
    const body = el.querySelector('#body');
    exportRows = [];
    if (school === 'all' && yearId) return drawYear(body);
    if (school === 'all') {
      // matrix: title × school (remaining), plus totals
      const schools = ref.schools;
      let html = `<div class="table-wrap"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
        <th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('remaining'))}</th>${schools.map(s => `<th class="n" title="${esc(nm(s))}">${esc(nm(s))}<span class="cell-sub">${esc(t('remaining'))}</span></th>`).join('')}</tr></thead><tbody>`;
      const tot = { a: 0, c: 0, s: 0, r: 0, per: {} };
      for (const d of ref.departments) {
        const titles = ref.titles.filter(x => x.department_id === d.id);
        html += `<tr class="group"><td colspan="${5 + schools.length}"><span class="stick">${esc(nm(d))}</span></td></tr>`;
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
          if (ti.per_lab) {
            // one line per lab across all schools
            const bySchool = schools.map(sc => breakdown(sc.id, ti.id));
            const names = [];
            bySchool.flat().forEach(r => { const k = r.unassigned ? '__u' : r.name; if (!names.includes(k)) names.push(k); });
            names.sort((x, y) => (x === '__u') - (y === '__u'));
            for (const k of names) {
              const cells = bySchool.map(list => list.find(r => (r.unassigned ? '__u' : r.name) === k));
              const S = (f) => cells.reduce((x, r) => x + (r ? r[f] : 0), 0);
              const label = k === '__u' ? t('lab_unassigned') : specLabel(k);
              html += `<tr class="sub ${k === '__u' ? 'unassigned' : ''}"><td>${esc(label)}</td><td class="n">${num(S('approved'))}</td><td class="n">${num(S('current'))}</td>
                <td class="n">${num(S('selected'))}</td><td class="n ${cls(S('remaining'))}">${num(S('remaining'))}</td>
                ${cells.map(r => `<td class="n ${r ? cls(r.remaining) : ''}">${r ? num(r.remaining) : '–'}</td>`).join('')}</tr>`;
              const er = { [t('department')]: nm(d), [t('job_title')]: `   ↳ ${label}`, [t('approved')]: S('approved'), [t('current_staff')]: S('current'), [t('selected')]: S('selected'), [t('remaining')]: S('remaining') };
              schools.forEach((sc, i) => { er[nm(sc)] = cells[i] ? cells[i].remaining : ''; });
              exportRows.push(er);
            }
          }
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
    let html = `<div class="table-wrap"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th><th>${esc(t('reports_to'))}</th>
      <th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th><th class="n">${esc(t('selected'))}</th>
      <th class="n">${esc(t('hired'))}</th><th class="n">${esc(t('joined'))}</th><th class="n">${esc(t('remaining'))}</th><th>${esc(t('vacancy_status'))}</th>
      ${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('selected'))} / ${esc(t('planned'))}</span></th>`).join('')}
      ${can('admin') ? '<th></th>' : ''}</tr></thead><tbody>`;
    const tot = { a: 0, c: 0, s: 0, h: 0, j: 0, r: 0, y: {} };
    for (const d of ref.departments) {
      const drows = rows.filter(r => r.department_id === d.id).sort((a, b) => ref.title[a.job_title_id].sort - ref.title[b.job_title_id].sort);
      if (!drows.length) continue;
      html += `<tr class="group"><td colspan="${9 + years.length + (can('admin') ? 1 : 0)}"><span class="stick">${esc(nm(d))}</span></td></tr>`;
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
        if (ti.per_lab) {
          const labs = breakdown(sid, ti.id);
          if (!labs.length) html += `<tr class="sub"><td colspan="${9 + years.length + (can('admin') ? 1 : 0)}"><span class="muted">${esc(t('no_labs'))}</span></td></tr>`;
          for (const l of labs) {
            html += `<tr class="sub ${l.unassigned ? 'unassigned' : ''}"><td>${esc(labName(l))}</td><td></td>
              <td class="n">${num(l.approved)}</td><td class="n">${num(l.current)}</td><td class="n">${num(l.selected)}</td>
              <td class="n">${num(l.hired)}</td><td class="n">${num(l.joined)}</td><td class="n ${cls(l.remaining)}">${num(l.remaining)}</td>
              <td>${l.unassigned ? '' : vacancyBadge(l.remaining)}</td>
              ${years.map(y => { const v = l.years[y.id]; return `<td class="n">${v.pl || v.se ? `${num(v.se)} / ${num(v.pl)}` : '<span class="muted">–</span>'}</td>`; }).join('')}
              ${can('admin') ? '<td></td>' : ''}</tr>`;
            const er = { [t('department')]: nm(d), [t('job_title')]: `   ↳ ${labName(l)}`, [t('approved')]: l.approved, [t('current_staff')]: l.current,
              [t('selected')]: l.selected, [t('hired')]: l.hired, [t('joined')]: l.joined, [t('remaining')]: l.remaining };
            years.forEach(y => { er[`${t('planned')} ${y.label}`] = l.years[y.id].pl; er[`${t('selected')} ${y.label}`] = l.years[y.id].se; });
            exportRows.push(er);
          }
        }
      }
    }
    html += `</tbody><tfoot><tr><td>${esc(t('total'))}</td><td></td><td class="n">${num(tot.a)}</td><td class="n">${num(tot.c)}</td><td class="n">${num(tot.s)}</td>
      <td class="n">${num(tot.h)}</td><td class="n">${num(tot.j)}</td><td class="n">${num(tot.r)}</td><td></td>
      ${years.map(y => `<td class="n">${num(tot.y[y.id]?.se || 0)} / ${num(tot.y[y.id]?.pl || 0)}</td>`).join('')}${can('admin') ? '<td></td>' : ''}</tr></tfoot></table></div>`;
    body.innerHTML = html;

    body.querySelectorAll('tr[data-t]').forEach(tr => tr.onclick = (e) => {
      if (e.target.closest('[data-edit]')) return;
      showCandidates(sid, Number(tr.dataset.t));
    });
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editCounts(sid, Number(b.dataset.edit)));
  }

  // All schools × one academic year: required hires (hiring plan) per job title, summed across schools
  function drawYear(body) {
    const schools = ref.schools;
    const yLabel = ref.yearById[yearId].label;
    const yrows = plan.filter(p => p.year_id === yearId);
    const sum = (list, f) => list.reduce((a, r) => a + (r[f] || 0), 0);
    let html = `<p class="muted" style="margin-top:0">${esc(t('year_need_hint'))}</p>
      <div class="table-wrap"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th>
      <th class="n">${esc(t('required_hires'))}<span class="cell-sub">${esc(yLabel)}</span></th><th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('remaining'))}</th>
      ${schools.map(s => `<th class="n" title="${esc(nm(s))}">${esc(nm(s))}<span class="cell-sub">${esc(t('required_hires'))}</span></th>`).join('')}</tr></thead><tbody>`;
    const tot = { pl: 0, se: 0, r: 0, per: {} };
    const cell = (v) => `<td class="n">${v ? num(v) : '<span class="muted">–</span>'}</td>`;
    for (const d of ref.departments) {
      const titles = ref.titles.filter(x => x.department_id === d.id)
        .filter(ti => pos.some(r => r.job_title_id === ti.id) || yrows.some(p => p.job_title_id === ti.id));
      if (!titles.length) continue;
      html += `<tr class="group"><td colspan="${4 + schools.length}"><span class="stick">${esc(nm(d))}</span></td></tr>`;
      for (const ti of titles) {
        const rows = yrows.filter(p => p.job_title_id === ti.id);
        const pl = sum(rows, 'planned'), se = sum(rows, 'selected'), rem = pl - se;
        const per = schools.map(sc => sum(rows.filter(p => p.school_id === sc.id), 'planned'));
        tot.pl += pl; tot.se += se; tot.r += Math.max(0, rem);
        per.forEach((v, i) => { tot.per[i] = (tot.per[i] || 0) + v; });
        html += `<tr><td>${esc(nm(ti))}</td><td class="n"><b>${num(pl)}</b></td><td class="n">${num(se)}</td><td class="n ${cls(rem)}">${num(rem)}</td>${per.map(cell).join('')}</tr>`;
        const row = { [t('department')]: nm(d), [t('job_title')]: nm(ti), [`${t('required_hires')} ${yLabel}`]: pl, [t('selected')]: se, [t('remaining')]: rem };
        schools.forEach((sc, i) => { row[nm(sc)] = per[i]; });
        exportRows.push(row);
        if (ti.per_lab) {
          const bySchool = schools.map(sc => breakdown(sc.id, ti.id));
          const names = [];
          bySchool.flat().forEach(r => { const k = r.unassigned ? '__u' : r.name; if (!names.includes(k)) names.push(k); });
          names.sort((x, y) => (x === '__u') - (y === '__u'));
          for (const k of names) {
            const cells = bySchool.map(list => list.find(r => (r.unassigned ? '__u' : r.name) === k)?.years[yearId] || { pl: 0, se: 0 });
            const lpl = sum(cells, 'pl'), lse = sum(cells, 'se');
            if (!lpl && !lse) continue;
            const label = k === '__u' ? t('lab_unassigned') : specLabel(k);
            html += `<tr class="sub ${k === '__u' ? 'unassigned' : ''}"><td>${esc(label)}</td><td class="n">${num(lpl)}</td><td class="n">${num(lse)}</td>
              <td class="n ${cls(lpl - lse)}">${num(lpl - lse)}</td>${cells.map(c => cell(c.pl)).join('')}</tr>`;
            const er = { [t('department')]: nm(d), [t('job_title')]: `   ↳ ${label}`, [`${t('required_hires')} ${yLabel}`]: lpl, [t('selected')]: lse, [t('remaining')]: lpl - lse };
            schools.forEach((sc, i) => { er[nm(sc)] = cells[i].pl; });
            exportRows.push(er);
          }
        }
      }
    }
    html += `</tbody><tfoot><tr><td>${esc(t('total'))}</td><td class="n">${num(tot.pl)}</td><td class="n">${num(tot.se)}</td><td class="n">${num(tot.r)}</td>
      ${schools.map((s, i) => `<td class="n">${num(tot.per[i] || 0)}</td>`).join('')}</tr></tfoot></table></div>`;
    body.innerHTML = html;
  }

  async function showCandidates(sid, tid) {
    const list = await db.list('candidates', { eq: { school_id: sid, job_title_id: tid }, order: [['full_name']] });
    modal({
      title: `${t('candidates_for')} ${titleName(tid)} — ${schoolName(sid)}`, wide: true,
      body: list.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('full_name'))}</th><th>${esc(t('specialization'))}</th><th>${esc(t('year'))}</th>
          <th>${esc(t('rating'))}</th><th>${esc(t('stage'))}</th></tr></thead><tbody>
          ${list.map(c => `<tr class="clickable" onclick="location.hash='#/candidate/${c.id}';document.querySelector('.modal-wrap').remove()">
            <td>${esc(c.full_name)}</td><td>${esc(specLabel(c.specialization))}</td><td>${esc(yearLabel(c.year_id))}</td><td>${ratingBadge(c.last_score)}</td><td>${stageBadge(c.stage)}</td></tr>`).join('')}
          </tbody></table></div>` : `<div class="empty">${esc(t('no_records'))}</div>`,
    });
  }

  function editCounts(sid, tid) {
    const p = positions.find(x => x.school_id === sid && x.job_title_id === tid);
    if (ref.title[tid].per_lab) return editLabs(sid, tid, p);
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
  // per-lab title: edit the school's labs (needed number + staff per lab)
  function editLabs(sid, tid, p) {
    const labs = schoolLabs(sid);
    const rowHtml = (l) => `<tr data-id="${l.id || ''}"><td><select class="lab-name">${labOptions(l.name || '', t('choose_lab'))}</select></td>
      <td class="n"><input class="num lab-app" type="number" min="0" value="${l.approved_count ?? 1}"></td>
      <td class="n"><input class="num lab-cur" type="number" min="0" value="${l.current_staff ?? 0}"></td>
      <td><button type="button" class="icon-btn lab-rm" title="${esc(t('delete'))}">✕</button></td></tr>`;
    const m = modal({
      title: `${t('edit_structure')}: ${titleName(tid)} — ${schoolName(sid)}`, wide: true,
      body: `<div class="form">
        <p class="muted" style="margin:0">${esc(t('labs_total_hint'))} ${esc(t('lab_staff_hint'))}</p>
        <div class="table-wrap"><table><thead><tr><th>${esc(t('lab'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th><th></th></tr></thead>
          <tbody id="labrows">${labs.map(rowHtml).join('')}</tbody>
          <tfoot><tr><td>${esc(t('total'))}</td><td class="n" id="labsum"></td><td class="n" id="labcur"></td><td></td></tr></tfoot></table></div>
        <button type="button" class="btn small" id="addlab" style="align-self:flex-start">＋ ${esc(t('add_lab'))}</button>
        <div class="grid2"><label>${esc(t('total_staff'))}<input name="current_staff" type="number" min="0" data-type="int" value="${p?.current_staff ?? 0}"></label></div>
        <label>${esc(t('notes'))}<textarea name="notes">${esc(p?.notes || '')}</textarea></label></div>`,
      onSave: async (w) => {
        const rows = [...w.querySelectorAll('#labrows tr')].map(tr => ({ id: tr.dataset.id ? Number(tr.dataset.id) : null,
          name: tr.querySelector('.lab-name').value, approved_count: Math.max(0, parseInt(tr.querySelector('.lab-app').value || '0', 10) || 0),
          current_staff: Math.max(0, parseInt(tr.querySelector('.lab-cur').value || '0', 10) || 0) })).filter(r => r.name);
        const names = rows.map(r => r.name);
        if (new Set(names).size !== names.length) throw new Error(state.lang === 'ar' ? 'مختبر مكرر' : 'A lab appears twice');
        const keep = new Set(rows.filter(r => r.id).map(r => r.id));
        for (const l of labs) if (!keep.has(l.id)) await db.remove('school_labs', l.id);
        for (const r of rows) {
          if (r.id) await db.update('school_labs', r.id, { name: r.name, approved_count: r.approved_count, current_staff: r.current_staff });
          else await db.insert('school_labs', { school_id: sid, name: r.name, approved_count: r.approved_count, current_staff: r.current_staff });
        }
        const v = readForm(w.querySelector('.grid2').parentElement);
        const labCur = rows.reduce((a, r) => a + r.current_staff, 0);
        const patch = { current_staff: Math.max(v.current_staff || 0, labCur), notes: v.notes,
          ...(rows.length ? {} : { approved_count: p?.approved_count ?? 0 }) };
        await db.upsert('school_positions', [{ ...(p ? { id: p.id } : {}), school_id: sid, job_title_id: tid, ...patch, updated_at: new Date().toISOString() }], 'school_id,job_title_id');
        await loadRef();
        [pos, positions, plan] = await Promise.all([
          db.list('v_position_status', { eq: { school_id: locked || undefined } }), db.list('school_positions'),
          db.list('v_plan_status', { eq: { school_id: locked || undefined } })]);
        toast(t('saved')); draw();
      },
    });
    const w = m.el;
    const totals = () => {
      const q = (c) => [...w.querySelectorAll(c)].reduce((a, i) => a + (parseInt(i.value || '0', 10) || 0), 0);
      w.querySelector('#labsum').textContent = num(q('.lab-app')); w.querySelector('#labcur').textContent = num(q('.lab-cur'));
    };
    const wire = () => { w.querySelectorAll('.lab-rm').forEach(b => b.onclick = () => { b.closest('tr').remove(); totals(); });
      w.querySelectorAll('.lab-app,.lab-cur').forEach(i => i.oninput = totals); };
    w.querySelector('#addlab').onclick = () => { w.querySelector('#labrows').insertAdjacentHTML('beforeend', rowHtml({ approved_count: 1, current_staff: 0 })); wire(); totals(); };
    wire(); totals();
    void fail;
  }
  draw();
}

const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero');
export { en };
