import { db } from '../api.js';
import { state, t, en, esc, num, pct, nm, options, lockedSchool, visibleSchools, schoolName, titleName, deptName,
  bar, chart, SERIES, vacancyBadge } from '../core.js';
import { ratingFor } from '../i18n.js';

const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);

export async function render(el, ctx) {
  const ref = state.ref;
  const locked = lockedSchool();
  const f = { school: locked || '', year: ref.currentYear?.id || '' };

  const [pos, plan, cands, ints] = await Promise.all([
    db.list('v_position_status', { eq: { school_id: locked || undefined } }),
    db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
    db.list('candidates', { select: 'id,school_id,job_title_id,year_id,stage,cv_source,last_score' }),
    db.list('interviews', { select: 'id,rating,candidate_id,school_id' }),
  ]);
  if (!ctx.seq()) return;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('nav_dashboard'))}</h2><p>${esc(t('structure_hint'))}</p></div></div>
    <div class="toolbar">
      <label>${esc(t('school'))}<select id="fs" ${locked ? 'disabled' : ''}>${options(visibleSchools(), f.school, { empty: locked ? null : t('all_schools') })}</select></label>
      <label>${esc(t('year'))}<select id="fy">${options(ref.planYears, f.year, { label: y => y.label })}</select></label>
    </div>
    <div id="body"></div>`;
  const body = el.querySelector('#body');
  el.querySelector('#fs').onchange = (e) => { f.school = e.target.value; draw(); };
  el.querySelector('#fy').onchange = (e) => { f.year = e.target.value; draw(); };

  function draw() {
    const sid = f.school ? Number(f.school) : null;
    const P = pos.filter(r => !sid || r.school_id === sid);
    const PL = plan.filter(r => !sid || r.school_id === sid);
    const C = cands.filter(c => !sid || c.school_id === sid);
    const I = ints.filter(i => !sid || C.some(c => c.id === i.candidate_id));
    const approved = sum(P, 'approved_count'), current = sum(P, 'current_staff'), selected = sum(P, 'selected');
    const remaining = P.reduce((a, r) => a + Math.max(0, r.remaining), 0);
    const yr = PL.filter(r => String(r.year_id) === String(f.year));
    const yPlanned = sum(yr, 'planned'), ySel = sum(yr, 'selected'), yHired = sum(yr, 'hired'), yJoined = sum(yr, 'joined');

    // by school
    const schoolRows = visibleSchools().filter(s => !sid || s.id === sid).map(s => {
      const r = pos.filter(x => x.school_id === s.id);
      const y = plan.filter(x => x.school_id === s.id && String(x.year_id) === String(f.year));
      return { s, approved: sum(r, 'approved_count'), current: sum(r, 'current_staff'), selected: sum(r, 'selected'),
        hired: sum(r, 'hired'), joined: sum(r, 'joined'), remaining: r.reduce((a, x) => a + Math.max(0, x.remaining), 0),
        planned: sum(y, 'planned'), ysel: sum(y, 'selected') };
    });
    const deptRows = ref.departments.map(d => {
      const r = P.filter(x => x.department_id === d.id);
      return { d, approved: sum(r, 'approved_count'), current: sum(r, 'current_staff'), selected: sum(r, 'selected'),
        remaining: r.reduce((a, x) => a + Math.max(0, x.remaining), 0) };
    });
    const shortages = [...P].filter(r => r.remaining > 0).sort((a, b) => b.remaining - a.remaining).slice(0, 10);

    const stageOrder = ['new', 'accepted', 'reserve', 'offer_sent', 'offer_accepted', 'documents_complete', 'hired', 'started',
      'probation_passed', 'confirmed', 'rejected', 'offer_declined', 'not_hired', 'probation_failed', 'resigned', 'withdrawn'];
    const stageCounts = stageOrder.map(s => [s, C.filter(c => c.stage === s).length]).filter(x => x[1] > 0);
    const srcCounts = ['job_fair', 'agency', 'ministry', 'school', 'other'].map(s => [s, C.filter(c => c.cv_source === s).length]);
    const ratingCounts = ['excellent', 'very_good', 'good', 'average', 'weak'].map(r => [r, I.filter(i => i.rating === r).length]);

    body.innerHTML = `
      <div class="kpis">
        ${kpi(t('kpi_approved'), approved)}${kpi(t('kpi_current'), current)}${kpi(t('kpi_selected'), selected)}
        ${kpi(t('kpi_hired'), sum(P, 'hired'))}${kpi(t('kpi_joined'), sum(P, 'joined'))}
        ${kpi(t('kpi_remaining'), remaining, true)}${kpi(t('kpi_occupancy'), pct(current + selected, approved) + '%')}
      </div>
      <div class="card">
        <h3>${esc(t('year_overview'))} — ${esc(ref.yearById[f.year]?.label || '')}</h3>
        <div class="kpis" style="margin:0">
          ${kpi(t('planned'), yPlanned)}${kpi(t('selected'), ySel)}${kpi(t('hired'), yHired)}${kpi(t('joined'), yJoined)}
          ${kpi(t('remaining'), Math.max(0, yPlanned - ySel), true)}
          <div class="kpi"><div class="v">${pct(ySel, yPlanned)}%</div><div class="l">${esc(t('fill_progress'))}</div>${bar(ySel, yPlanned)}</div>
        </div>
      </div>
      <div class="cards">
        <div class="card" style="grid-column:1/-1"><h3>${esc(t('by_school'))}</h3>
          <div class="table-wrap"><table><thead><tr><th>${esc(t('school'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
            <th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('remaining'))}</th><th class="n">${esc(t('planned'))} ${esc(ref.yearById[f.year]?.label || '')}</th><th>${esc(t('occupancy'))}</th></tr></thead>
          <tbody>${schoolRows.map(r => `<tr class="clickable" data-href="#/structure?school=${r.s.id}"><td>${esc(nm(r.s))}</td><td class="n">${num(r.approved)}</td><td class="n">${num(r.current)}</td>
            <td class="n">${num(r.selected)}</td><td class="n ${r.remaining ? 'pos' : 'zero'}">${num(r.remaining)}</td><td class="n">${num(r.ysel)} / ${num(r.planned)}</td>
            <td>${pct(r.current + r.selected, r.approved)}% ${bar(r.current + r.selected, r.approved, 'green')}</td></tr>`).join('')}</tbody>
          ${schoolRows.length > 1 ? `<tfoot><tr><td>${esc(t('total'))}</td><td class="n">${num(sum(schoolRows, 'approved'))}</td><td class="n">${num(sum(schoolRows, 'current'))}</td>
            <td class="n">${num(sum(schoolRows, 'selected'))}</td><td class="n">${num(sum(schoolRows, 'remaining'))}</td><td class="n">${num(sum(schoolRows, 'ysel'))} / ${num(sum(schoolRows, 'planned'))}</td>
            <td>${pct(sum(schoolRows, 'current') + sum(schoolRows, 'selected'), sum(schoolRows, 'approved'))}%</td></tr></tfoot>` : ''}</table></div></div>
        <div class="card" style="grid-column:1/-1"><h3>${esc(t('by_department'))}</h3>
          <div class="table-wrap"><table><thead><tr><th>${esc(t('department'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
            <th class="n">${esc(t('selected'))}</th><th class="n">${esc(t('remaining'))}</th><th>${esc(t('occupancy'))}</th></tr></thead>
          <tbody>${deptRows.map(r => `<tr><td>${esc(nm(r.d))}</td><td class="n">${num(r.approved)}</td><td class="n">${num(r.current)}</td><td class="n">${num(r.selected)}</td>
            <td class="n ${r.remaining ? 'pos' : 'zero'}">${num(r.remaining)}</td><td>${bar(r.current + r.selected, r.approved, 'green')}</td></tr>`).join('')}</tbody></table></div></div>
      </div>
      <div class="cards">
        <div class="card"><h3>${esc(t('plan_vs_selected'))}</h3><div class="chart-box"><canvas id="c1"></canvas></div></div>
        <div class="card"><h3>${esc(t('pipeline'))}</h3>${stageCounts.length ? '<div class="chart-box"><canvas id="c2"></canvas></div>' : `<div class="empty">${esc(t('no_records'))}</div>`}</div>
      </div>
      <div class="cards">
        <div class="card"><h3>${esc(t('shortages'))}</h3>
          ${shortages.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('job_title'))}</th><th>${esc(t('school'))}</th><th class="n">${esc(t('remaining'))}</th></tr></thead>
          <tbody>${shortages.map(r => `<tr><td>${esc(titleName(r.job_title_id))}<span class="cell-sub">${esc(deptName(r.department_id))}</span></td><td>${esc(schoolName(r.school_id))}</td><td class="n">${vacancyBadge(r.remaining)}</td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${esc(t('vac_filled'))}</div>`}</div>
        <div class="card"><h3>${esc(t('cv_sources'))} · ${esc(t('ratings'))}</h3>
          <div class="table-wrap"><table><tbody>
            ${srcCounts.map(([k, v]) => `<tr><td>${esc(en('cv_source', k))}</td><td class="n">${num(v)}</td><td>${bar(v, C.length || 1)}</td></tr>`).join('')}
            <tr class="group"><td colspan="3">${esc(t('ratings'))} (${num(I.length)} ${esc(t('interviews_count'))})</td></tr>
            ${ratingCounts.map(([k, v]) => `<tr><td><span class="rating rating-${k}">${esc(en('rating', k))}</span></td><td class="n">${num(v)}</td><td>${bar(v, I.length || 1)}</td></tr>`).join('')}
          </tbody></table></div></div>
      </div>`;

    body.querySelectorAll('tr[data-href]').forEach(tr => tr.onclick = () => { location.hash = tr.dataset.href; });

    // charts — 2 series (planned / selected), validated categorical slots 1–2, legend on
    const years = ref.planYears;
    chart(body.querySelector('#c1'), {
      type: 'bar',
      data: {
        labels: years.map(y => y.label),
        datasets: [
          { label: t('planned'), data: years.map(y => sum(PL.filter(r => r.year_id === y.id), 'planned')), backgroundColor: SERIES[0], borderRadius: 4, maxBarThickness: 28 },
          { label: t('selected'), data: years.map(y => sum(PL.filter(r => r.year_id === y.id), 'selected')), backgroundColor: SERIES[1], borderRadius: 4, maxBarThickness: 28 },
        ],
      },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } },
    });
    if (stageCounts.length) chart(body.querySelector('#c2'), {
      type: 'bar',
      data: { labels: stageCounts.map(s => en('stage', s[0])), datasets: [{ label: t('candidates'), data: stageCounts.map(s => s[1]), backgroundColor: SERIES[0], borderRadius: 4, maxBarThickness: 18 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } },
    });
  }
  draw();
}

function kpi(label, value, accent = false) {
  return `<div class="kpi ${accent ? 'accent' : ''}"><div class="v">${typeof value === 'number' ? num(value) : esc(value)}</div><div class="l">${esc(label)}</div></div>`;
}
export { ratingFor };
