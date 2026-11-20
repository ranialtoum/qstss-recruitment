// Hiring plan: number to hire per school × title × year (optionally split by specialisation)
import { db } from '../api.js';
import { LABS } from '../i18n.js';
import { specLabel } from '../core.js';
import { state, t, esc, num, nm, can, lockedSchool, visibleSchools, schoolName, titleName, modal, toast, fail, exportXlsx } from '../core.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const locked = lockedSchool();
  const editable = can('manage');
  let school = String(locked || ctx.params.school || 'all');
  let dept = '';

  let [plan, prog, pos] = await Promise.all([
    db.list('hiring_plan', { eq: { school_id: locked || undefined } }),
    db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
    db.list('v_position_status', { eq: { school_id: locked || undefined } }),
  ]);
  if (!ctx.seq()) return;
  const years = ref.planYears;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('plan_title'))}</h2><p>${esc(t('plan_hint'))}</p></div>
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div>
    <div class="toolbar">
      <label>${esc(t('school'))}<select id="fs" ${locked ? 'disabled' : ''}>${locked ? '' : `<option value="all">${esc(t('all_schools'))}</option>`}
        ${visibleSchools().map(s => `<option value="${s.id}" ${String(s.id) === school ? 'selected' : ''}>${esc(nm(s))}</option>`).join('')}</select></label>
      <label>${esc(t('department'))}<select id="fd"><option value="">${esc(t('all'))}</option>${ref.departments.map(d => `<option value="${d.id}">${esc(nm(d))}</option>`).join('')}</select></label>
    </div>
    <div id="body"></div>`;
  el.querySelector('#fs').value = school;
  el.querySelector('#fs').onchange = (e) => { school = e.target.value; draw(); };
  el.querySelector('#fd').onchange = (e) => { dept = e.target.value; draw(); };
  let exportRows = [];
  el.querySelector('#xl').onclick = () => exportXlsx([{ name: t('nav_plan'), rows: exportRows }], 'hiring_plan');

  const planned = (sid, tid, yid) => plan.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid);
  const sel = (sid, tid, yid) => prog.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid).reduce((a, x) => a + x.selected, 0);
  const sumP = (rows) => rows.reduce((a, x) => a + x.planned_count, 0);

  function draw() {
    const body = el.querySelector('#body');
    exportRows = [];
    if (school === 'all') {
      body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>${esc(t('school'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
        <th class="n">${esc(t('remaining'))}</th>${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('selected'))} / ${esc(t('planned'))}</span></th>`).join('')}
        <th class="n">${esc(t('plan_total'))}</th><th class="n">${esc(t('gap'))}</th></tr></thead><tbody>
        ${ref.schools.map(s => {
          const P = pos.filter(r => r.school_id === s.id && (!dept || String(r.department_id) === dept));
          const tids = new Set(P.map(r => r.job_title_id));
          const a = P.reduce((x, r) => x + r.approved_count, 0), c = P.reduce((x, r) => x + r.current_staff, 0);
          const rem = P.reduce((x, r) => x + Math.max(0, r.remaining), 0);
          const ys = years.map(y => {
            const pl = sumP(plan.filter(p => p.school_id === s.id && p.year_id === y.id && tids.has(p.job_title_id)));
            const se = prog.filter(p => p.school_id === s.id && p.year_id === y.id && tids.has(p.job_title_id)).reduce((x, r) => x + r.selected, 0);
            return { pl, se };
          });
          const tp = ys.reduce((x, y) => x + y.pl, 0);
          const row = { [t('school')]: nm(s), [t('approved')]: a, [t('current_staff')]: c, [t('remaining')]: rem };
          years.forEach((y, i) => { row[`${t('planned')} ${y.label}`] = ys[i].pl; row[`${t('selected')} ${y.label}`] = ys[i].se; });
          row[t('plan_total')] = tp; row[t('gap')] = Math.max(0, (a - c) - tp);
          exportRows.push(row);
          return `<tr class="clickable" data-s="${s.id}"><td>${esc(nm(s))}</td><td class="n">${num(a)}</td><td class="n">${num(c)}</td><td class="n">${num(rem)}</td>
            ${ys.map(y => `<td class="n">${num(y.se)} / ${num(y.pl)}</td>`).join('')}<td class="n"><b>${num(tp)}</b></td>
            <td class="n ${(a - c) - tp > 0 ? 'pos' : 'zero'}">${num(Math.max(0, (a - c) - tp))}</td></tr>`;
        }).join('')}</tbody></table></div>`;
      body.querySelectorAll('tr[data-s]').forEach(tr => tr.onclick = () => { school = tr.dataset.s; el.querySelector('#fs').value = school; draw(); });
      return;
    }

    const sid = Number(school);
    const rows = pos.filter(r => r.school_id === sid && (!dept || String(r.department_id) === dept))
      .sort((a, b) => ref.title[a.job_title_id].sort - ref.title[b.job_title_id].sort);
    let html = `<div class="table-wrap"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th><th class="n">${esc(t('approved'))}</th>
      <th class="n">${esc(t('current_staff'))}</th><th class="n">${esc(t('remaining'))}</th>
      ${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('planned'))} · ${esc(t('selected'))}</span></th>`).join('')}
      <th class="n">${esc(t('plan_total'))}</th><th class="n">${esc(t('gap'))}</th></tr></thead><tbody>`;
    const tot = { y: {}, tp: 0, gap: 0 };
    let lastDept = null;
    for (const r of rows) {
      if (r.department_id !== lastDept) { lastDept = r.department_id; html += `<tr class="group"><td colspan="${6 + years.length}">${esc(nm(ref.dept[r.department_id]))}</td></tr>`; }
      const need = r.approved_count - r.current_staff;
      let tp = 0;
      const row = { [t('department')]: nm(ref.dept[r.department_id]), [t('job_title')]: titleName(r.job_title_id), [t('approved')]: r.approved_count, [t('current_staff')]: r.current_staff, [t('remaining')]: r.remaining };
      const cells = years.map(y => {
        const ps = planned(sid, r.job_title_id, y.id);
        const total = sumP(ps); tp += total;
        const hasSpecs = ps.some(p => p.specialization);
        const s = sel(sid, r.job_title_id, y.id);
        tot.y[y.id] = tot.y[y.id] || { pl: 0, se: 0 }; tot.y[y.id].pl += total; tot.y[y.id].se += s;
        row[`${t('planned')} ${y.label}`] = total; row[`${t('selected')} ${y.label}`] = s;
        const specTip = hasSpecs ? ps.filter(p => p.planned_count).map(p => `${specLabel(p.specialization) || '—'}: ${p.planned_count}`).join('\n') : '';
        return `<td class="n" style="white-space:nowrap">
          ${editable && !hasSpecs ? `<input class="num" type="number" min="0" value="${total || ''}" placeholder="0" data-t="${r.job_title_id}" data-y="${y.id}">`
            : `<b title="${esc(specTip)}">${num(total)}</b>`}
          ${editable || hasSpecs ? `<button class="icon-btn" title="${esc(t('breakdown'))}" data-bd="${r.job_title_id}:${y.id}">${hasSpecs ? '⋯' : '＋'}</button>` : ''}
          <span class="cell-sub">${s ? `✓ ${num(s)}` : ''}</span></td>`;
      }).join('');
      const gap = need - tp;
      tot.tp += tp; tot.gap += Math.max(0, gap);
      row[t('plan_total')] = tp; row[t('gap')] = gap;
      exportRows.push(row);
      html += `<tr><td>${esc(titleName(r.job_title_id))}</td><td class="n">${num(r.approved_count)}</td><td class="n">${num(r.current_staff)}</td>
        <td class="n">${num(r.remaining)}</td>${cells}<td class="n"><b>${num(tp)}</b></td>
        <td class="n ${gap > 0 ? 'pos' : gap < 0 ? 'neg' : 'zero'}" title="${gap < 0 ? esc(t('plan_exceeds')) : ''}">${num(gap)}${gap < 0 ? ' ⚠' : ''}</td></tr>`;
    }
    html += `</tbody><tfoot><tr><td colspan="4">${esc(t('total'))}</td>${years.map(y => `<td class="n">${num(tot.y[y.id]?.pl || 0)}<span class="cell-sub">✓ ${num(tot.y[y.id]?.se || 0)}</span></td>`).join('')}
      <td class="n">${num(tot.tp)}</td><td class="n">${num(tot.gap)}</td></tr></tfoot></table></div>`;
    body.innerHTML = html;

    body.querySelectorAll('input[data-t]').forEach(inp => inp.onchange = async () => {
      const tid = Number(inp.dataset.t), yid = Number(inp.dataset.y), v = Math.max(0, parseInt(inp.value || '0', 10) || 0);
      try { await savePlan(sid, tid, yid, [{ specialization: '', planned_count: v }]); toast(t('saved')); draw(); } catch (e) { fail(e); }
    });
    body.querySelectorAll('[data-bd]').forEach(b => b.onclick = () => {
      const [tid, yid] = b.dataset.bd.split(':').map(Number);
      breakdown(sid, tid, yid);
    });
  }

  async function savePlan(sid, tid, yid, specRows) {
    const existing = planned(sid, tid, yid);
    const keep = specRows.filter(r => r.planned_count > 0);
    const keepKeys = new Set(keep.map(r => r.specialization));
    for (const e of existing) if (!keepKeys.has(e.specialization)) await db.remove('hiring_plan', e.id);
    if (keep.length) {
      await db.upsert('hiring_plan', keep.map(r => ({ school_id: sid, job_title_id: tid, year_id: yid, specialization: r.specialization, planned_count: r.planned_count,
        updated_at: new Date().toISOString(), updated_by: state.profile.id })), 'school_id,job_title_id,year_id,specialization');
    }
    [plan, prog] = await Promise.all([
      db.list('hiring_plan', { eq: { school_id: locked || undefined } }),
      db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
    ]);
  }

  function breakdown(sid, tid, yid) {
    const ps = planned(sid, tid, yid);
    const rows = ps.length ? ps.map(p => ({ specialization: p.specialization, planned_count: p.planned_count })) : [{ specialization: '', planned_count: 0 }];
    const ti = ref.title[tid];
    const own = ref.labs.filter(l => l.school_id === sid).map(l => l.name);
    const suggestions = ti.category === 'lab' ? [...new Set([...(ti.per_lab ? own : []), ...LABS.map(l => l[0])])] : [];
    const rowHtml = (r) => `<div class="row spec-row" style="margin-bottom:.4rem">
      <input class="spec" list="speclist" placeholder="${esc(t('specialization'))}" value="${esc(r.specialization)}" style="flex:1" ${editable ? '' : 'disabled'}>
      <input class="num cnt" type="number" min="0" value="${r.planned_count}" ${editable ? '' : 'disabled'}>
      ${editable ? '<button class="icon-btn rm">✕</button>' : ''}</div>`;
    const m = modal({
      title: `${t('breakdown')}: ${titleName(tid)} — ${schoolName(sid)} · ${state.ref.yearById[yid].label}`,
      body: `<datalist id="speclist">${suggestions.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <div id="specs">${rows.map(rowHtml).join('')}</div>
        ${editable ? `<button class="btn small" id="addspec">＋ ${esc(t('add_row'))}</button>` : ''}`,
      onSave: editable ? async (w) => {
        const out = [...w.querySelectorAll('.spec-row')].map(r => ({ specialization: r.querySelector('.spec').value.trim(), planned_count: parseInt(r.querySelector('.cnt').value || '0', 10) || 0 }));
        const merged = {};
        out.forEach(r => { merged[r.specialization] = (merged[r.specialization] || 0) + r.planned_count; });
        await savePlan(sid, tid, yid, Object.entries(merged).map(([specialization, planned_count]) => ({ specialization, planned_count })));
        toast(t('saved')); draw();
      } : null,
    });
    const wire = () => m.el.querySelectorAll('.rm').forEach(b => b.onclick = () => b.closest('.spec-row').remove());
    wire();
    const add = m.el.querySelector('#addspec');
    if (add) add.onclick = () => { m.el.querySelector('#specs').insertAdjacentHTML('beforeend', rowHtml({ specialization: '', planned_count: 0 })); wire(); };
  }
  draw();
}
