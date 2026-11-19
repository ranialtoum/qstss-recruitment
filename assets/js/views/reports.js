// Reports: flexible cross-tabs of candidates and interviews, and the full vacancies workbook
import { db } from '../api.js';
import { state, t, en, esc, num, pct, nm, options, titleOptions, enumOptions, lockedSchool, visibleSchools, schoolName, titleName,
  deptName, yearLabel, exportXlsx, candidateRow, chart, SERIES, bar, specLabel } from '../core.js';
import { ratingFor } from '../i18n.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const [cands, ints, pos, plan] = await Promise.all([
    db.list('candidates'), db.list('interviews'),
    db.list('v_position_status', { eq: { school_id: lockedSchool() || undefined } }),
    db.list('v_plan_status', { eq: { school_id: lockedSchool() || undefined } }),
  ]);
  if (!ctx.seq()) return;
  const candById = Object.fromEntries(cands.map(c => [c.id, c]));

  const CDIMS = {
    school: [t('school'), c => c.school_id, v => schoolName(Number(v))],
    job_title: [t('job_title'), c => c.job_title_id, v => titleName(Number(v))],
    department: [t('department'), c => ref.title[c.job_title_id]?.department_id, v => deptName(Number(v))],
    specialization: [`${t('specialization')} / ${t('lab')}`, c => c.specialization, v => specLabel(v)],
    nationality: [t('nationality'), c => c.nationality, v => v],
    cv_source: [t('cv_source'), c => c.cv_source, v => en('cv_source', v)],
    stage: [t('stage'), c => c.stage, v => en('stage', v)],
    result: [t('result'), c => c.interview_result, v => en('result', v)],
    rating: [t('rating'), c => ratingFor(c.last_score), v => en('rating', v)],
    year: [t('year'), c => c.year_id, v => yearLabel(Number(v))],
    inside_qatar: [t('inside_qatar'), c => c.inside_qatar, v => en('inside_qatar', v)],
    residence_country: [t('residence_country'), c => c.residence_country, v => v],
    visa_status: [t('visa_status'), c => c.visa_status, v => en('visa_status', v)],
    gender: [t('gender'), c => c.gender, v => en('gender', v)],
    marital_status: [t('marital_status'), c => c.marital_status, v => en('marital_status', v)],
  };
  const month = (d) => (d || '').slice(0, 7);
  const IDIMS = {
    month: [state.lang === 'ar' ? 'الشهر' : 'Month', i => month(i.interview_date), v => v],
    job_title: [t('job_title'), i => i.job_title_id, v => titleName(Number(v))],
    school: [t('recommended_school'), i => i.school_id, v => schoolName(Number(v))],
    source: [t('source'), i => i.source, v => en('cv_source', v)],
    mode: [t('mode'), i => i.mode, v => en('mode', v)],
    rating: [t('rating'), i => i.rating, v => en('rating', v)],
    result: [t('interview_result'), i => i.result, v => en('result', v)],
    nationality: [t('nationality'), i => candById[i.candidate_id]?.nationality, v => v],
    specialization: [`${t('specialization')} / ${t('lab')}`, i => i.specialization || candById[i.candidate_id]?.specialization, v => specLabel(v)],
    interviewers: [t('interviewers'), i => i.interviewers, v => v],
  };

  let tab = 'analysis';
  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('nav_reports'))}</h2><p>${esc(t('report_hint'))}</p></div></div>
    <div class="tabs" id="tabs">
      <button data-t="analysis">${esc(t('report_analysis'))}</button>
      <button data-t="interviews">${esc(t('report_interviews'))}</button>
      <button data-t="vacancies">${esc(t('report_vacancies'))}</button>
    </div><div id="body"></div>`;
  el.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });

  const cf = { row: 'school', col: 'stage', school: lockedSchool() || '', year: '', title: '', stage: '', src: '' };
  const icf = { row: 'month', col: 'rating', from: '', to: '', title: '' };

  function draw() {
    el.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.t === tab));
    const body = el.querySelector('#body');
    if (tab === 'vacancies') return vacancies(body);
    const isC = tab === 'analysis';
    const dims = isC ? CDIMS : IDIMS, f = isC ? cf : icf;
    const dimSel = (name, val, allowNone) => `<select name="${name}">${allowNone ? `<option value="">—</option>` : ''}${Object.entries(dims).map(([k, d]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(d[0])}</option>`).join('')}</select>`;
    body.innerHTML = `<div class="toolbar" id="rf">
      <label>${esc(t('group_by'))}${dimSel('row', f.row, false)}</label>
      <label>${esc(t('then_by'))}${dimSel('col', f.col, true)}</label>
      ${isC ? `
      <label>${esc(t('school'))}<select name="school" ${lockedSchool() ? 'disabled' : ''}>${options(visibleSchools(), f.school, { empty: t('all') })}</select></label>
      <label>${esc(t('year'))}<select name="year">${options(ref.planYears, f.year, { empty: t('all'), label: y => y.label })}</select></label>
      <label>${esc(t('job_title'))}<select name="title">${titleOptions(f.title, t('all'))}</select></label>
      <label>${esc(t('stage'))}<select name="stage">${enumOptions('stage', f.stage, t('all'))}</select></label>
      <label>${esc(t('cv_source'))}<select name="src">${enumOptions('cv_source', f.src, t('all'))}</select></label>`
      : `<label>${esc(t('from'))}<input type="date" name="from" value="${f.from}"></label><label>${esc(t('to'))}<input type="date" name="to" value="${f.to}"></label>
      <label>${esc(t('job_title'))}<select name="title">${titleOptions(f.title, t('all'))}</select></label>`}
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button>
    </div><div id="out"></div>`;
    body.querySelectorAll('#rf [name]').forEach(i => i.onchange = () => { f[i.name] = i.value; out(); });

    let data = [];
    const filterData = () => isC
      ? cands.filter(c => (!f.school || String(c.school_id) === String(f.school)) && (!f.year || String(c.year_id) === f.year) &&
          (!f.title || String(c.job_title_id) === f.title) && (!f.stage || c.stage === f.stage) && (!f.src || c.cv_source === f.src))
      : ints.filter(i => (!f.from || i.interview_date >= f.from) && (!f.to || i.interview_date <= f.to) && (!f.title || String(i.job_title_id) === f.title));

    function out() {
      data = filterData();
      const R = dims[f.row], C = f.col ? dims[f.col] : null;
      const key = v => (v === null || v === undefined || v === '' ? '∅' : String(v));
      const lab = (d, v) => (v === '∅' ? (state.lang === 'ar' ? 'غير محدد' : 'Not set') : (d[2](v) || v));
      const rows = {}, cols = new Set();
      data.forEach(x => {
        const r = key(R[1](x)), c = C ? key(C[1](x)) : '_';
        rows[r] = rows[r] || {}; rows[r][c] = (rows[r][c] || 0) + 1; cols.add(c);
      });
      const colKeys = [...cols].sort();
      const rowKeys = Object.keys(rows).sort((a, b) => sumRow(rows[b]) - sumRow(rows[a]));
      const total = data.length;
      const colTot = Object.fromEntries(colKeys.map(c => [c, rowKeys.reduce((a, r) => a + (rows[r][c] || 0), 0)]));
      body.querySelector('#out').innerHTML = `
        <div class="cards"><div class="card" style="grid-column:1/-1">
          <div class="row-between"><h3>${esc(R[0])}${C ? ` × ${esc(C[0])}` : ''}</h3><span class="muted">${num(total)} ${esc(t('count_records'))}</span></div>
          <div class="table-wrap"><table><thead><tr><th>${esc(R[0])}</th>
            ${C ? colKeys.map(c => `<th class="n">${esc(lab(C, c))}</th>`).join('') : ''}<th class="n">${esc(t('total'))}</th><th class="n">${esc(t('percent'))}</th><th></th></tr></thead>
          <tbody>${rowKeys.map(r => `<tr><td>${esc(lab(R, r))}</td>${C ? colKeys.map(c => `<td class="n">${rows[r][c] ? num(rows[r][c]) : '<span class="muted">·</span>'}</td>`).join('') : ''}
            <td class="n"><b>${num(sumRow(rows[r]))}</b></td><td class="n">${pct(sumRow(rows[r]), total)}%</td><td style="min-width:120px">${bar(sumRow(rows[r]), total)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td>${esc(t('total'))}</td>${C ? colKeys.map(c => `<td class="n">${num(colTot[c])}</td>`).join('') : ''}<td class="n">${num(total)}</td><td class="n">100%</td><td></td></tr></tfoot></table></div>
        </div>
        ${!C && rowKeys.length ? `<div class="card" style="grid-column:1/-1"><div class="chart-box"><canvas id="rc"></canvas></div></div>` : ''}</div>`;
      if (!C && rowKeys.length) chart(body.querySelector('#rc'), {
        type: 'bar', data: { labels: rowKeys.map(r => lab(R, r)), datasets: [{ label: t('count'), data: rowKeys.map(r => sumRow(rows[r])), backgroundColor: SERIES[0], borderRadius: 4, maxBarThickness: 32 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } },
      });
      body.querySelector('#xl').onclick = () => {
        const summary = rowKeys.map(r => {
          const o = { [R[0]]: lab(R, r) };
          if (C) colKeys.forEach(c => { o[lab(C, c)] = rows[r][c] || 0; });
          o[t('total')] = sumRow(rows[r]); o[t('percent')] = pct(sumRow(rows[r]), total);
          return o;
        });
        const detail = isC ? data.map(candidateRow) : data.map(i => ({ [t('date')]: i.interview_date, [t('full_name')]: candById[i.candidate_id]?.full_name || '',
          [t('job_title')]: titleName(i.job_title_id), [t('source')]: en('cv_source', i.source), [t('mode')]: en('mode', i.mode), [t('interviewers')]: i.interviewers || '',
          [t('overall_score')]: i.overall_score ?? '', [t('rating')]: en('rating', i.rating), [t('interview_result')]: en('result', i.result) }));
        exportXlsx([{ name: t('summary_sheet'), rows: summary }, { name: t('detail_sheet'), rows: detail }], isC ? 'candidate_report' : 'interview_report');
      };
    }
    out();
  }

  function vacancies(body) {
    const years = ref.planYears;
    const schools = visibleSchools();
    const summary = schools.map(s => {
      const P = pos.filter(r => r.school_id === s.id);
      const o = { s, a: P.reduce((x, r) => x + r.approved_count, 0), c: P.reduce((x, r) => x + r.current_staff, 0),
        sel: P.reduce((x, r) => x + r.selected, 0), h: P.reduce((x, r) => x + r.hired, 0), j: P.reduce((x, r) => x + r.joined, 0),
        rem: P.reduce((x, r) => x + Math.max(0, r.remaining), 0) };
      o.y = years.map(y => { const L = plan.filter(p => p.school_id === s.id && p.year_id === y.id); return { pl: L.reduce((x, r) => x + r.planned, 0), se: L.reduce((x, r) => x + r.selected, 0) }; });
      return o;
    });
    body.innerHTML = `<div class="card"><div class="row-between"><h3>${esc(t('report_vacancies'))}</h3><button class="btn primary" id="xlv">⇩ ${esc(t('export_excel'))}</button></div>
      <div class="table-wrap"><table><thead><tr><th>${esc(t('school'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
      <th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('hired'))}</th><th class="n">${esc(t('joined'))}</th><th class="n">${esc(t('remaining'))}</th>
      ${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('selected'))} / ${esc(t('planned'))}</span></th>`).join('')}<th>${esc(t('occupancy'))}</th></tr></thead>
      <tbody>${summary.map(o => `<tr><td>${esc(nm(o.s))}</td><td class="n">${num(o.a)}</td><td class="n">${num(o.c)}</td><td class="n">${num(o.sel)}</td><td class="n">${num(o.h)}</td>
        <td class="n">${num(o.j)}</td><td class="n pos">${num(o.rem)}</td>${o.y.map(y => `<td class="n">${num(y.se)} / ${num(y.pl)}</td>`).join('')}
        <td>${pct(o.c + o.sel, o.a)}% ${bar(o.c + o.sel, o.a, 'green')}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted">${esc(state.lang === 'ar' ? 'يتضمن ملف Excel ورقة ملخص وورقة لكل مدرسة بالتفصيل حسب المسمى الوظيفي والسنوات.' : 'The Excel file contains a summary sheet plus one detailed sheet per school (by job title and year).')}</p></div>`;
    body.querySelector('#xlv').onclick = () => {
      const sheets = [{ name: t('summary_sheet'), rows: summary.map(o => {
        const r = { [t('school')]: nm(o.s), [t('approved')]: o.a, [t('current_staff')]: o.c, [t('selected')]: o.sel, [t('hired')]: o.h, [t('joined')]: o.j, [t('remaining')]: o.rem };
        years.forEach((y, i) => { r[`${t('planned')} ${y.label}`] = o.y[i].pl; r[`${t('selected')} ${y.label}`] = o.y[i].se; });
        r[t('occupancy')] = `${pct(o.c + o.sel, o.a)}%`; return r;
      }) }];
      for (const s of schools) {
        sheets.push({ name: nm(s), rows: pos.filter(r => r.school_id === s.id).sort((a, b) => ref.title[a.job_title_id].sort - ref.title[b.job_title_id].sort).map(r => {
          const o = { [t('department')]: deptName(r.department_id), [t('job_title')]: titleName(r.job_title_id), [t('approved')]: r.approved_count, [t('current_staff')]: r.current_staff,
            [t('selected')]: r.selected, [t('hired')]: r.hired, [t('joined')]: r.joined, [t('remaining')]: r.remaining };
          years.forEach(y => { const L = plan.filter(p => p.school_id === s.id && p.job_title_id === r.job_title_id && p.year_id === y.id);
            o[`${t('planned')} ${y.label}`] = L.reduce((x, q) => x + q.planned, 0); o[`${t('selected')} ${y.label}`] = L.reduce((x, q) => x + q.selected, 0); });
          return o;
        }) });
      }
      exportXlsx(sheets, 'vacancies_report');
    };
  }
  draw();
}
const sumRow = (o) => Object.values(o).reduce((a, b) => a + b, 0);
