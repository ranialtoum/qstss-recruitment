// Hiring plan: number to hire per school × title × year (optionally per lab / specialisation).
// Edits are collected locally and written together with "Save all" — the page does not redraw while typing.
import { db } from '../api.js';
import { LABS } from '../i18n.js';
import { specLabel, planBySpec, labOptions } from '../core.js';
import { schoolLabs } from './labs.js';
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

  // ---------- unsaved edits ----------
  const pending = new Map();                 // "sid|tid|yid|spec" -> number
  const extraSpecs = {};                     // lab / specialisation lines added but not yet saved
  const pkey = (sid, tid, yid, spec) => `${sid}|${tid}|${yid}|${spec}`;
  const savedVal = (sid, tid, yid, spec) => plan.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid && p.specialization === spec)
    .reduce((a, x) => a + x.planned_count, 0);
  const cellVal = (sid, tid, yid, spec) => (pending.has(pkey(sid, tid, yid, spec)) ? pending.get(pkey(sid, tid, yid, spec)) : savedVal(sid, tid, yid, spec));
  function setPending(sid, tid, yid, spec, v) {
    v = Math.max(0, parseInt(v || '0', 10) || 0);
    if (v === savedVal(sid, tid, yid, spec)) pending.delete(pkey(sid, tid, yid, spec)); else pending.set(pkey(sid, tid, yid, spec), v);
    updateBar();
  }
  // all specialisations used for a cell (saved + unsaved)
  function specsFor(sid, tid, yid) {
    const s = new Set(plan.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid).map(p => p.specialization));
    for (const k of pending.keys()) { const [a, b, c, ...rest] = k.split('|'); if (+a === sid && +b === tid && +c === yid) s.add(rest.join('|')); }
    return [...s];
  }
  const yearTotal = (sid, tid, yid) => specsFor(sid, tid, yid)
    .filter(sp => sp || !planBySpec(ref.title[tid]))            // lab-detail titles: only named lines count
    .reduce((a, sp) => a + cellVal(sid, tid, yid, sp), 0);
  window.qsUnsaved = () => pending.size;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('plan_title'))}</h2><p>${esc(t('plan_hint'))}</p></div>
      <button class="btn" id="xl">⇩ ${esc(t('export_excel'))}</button></div>
    <div class="toolbar">
      <label>${esc(t('school'))}<select id="fs" ${locked ? 'disabled' : ''}>${locked ? '' : `<option value="all">${esc(t('all_schools'))}</option>`}
        ${visibleSchools().map(s => `<option value="${s.id}" ${String(s.id) === school ? 'selected' : ''}>${esc(nm(s))}</option>`).join('')}</select></label>
      <label>${esc(t('department'))}<select id="fd"><option value="">${esc(t('all'))}</option>${ref.departments.map(d => `<option value="${d.id}">${esc(nm(d))}</option>`).join('')}</select></label>
    </div>
    <div id="body"></div>
    <div class="savebar hidden" id="savebar"><span id="savecount"></span><span class="spacer"></span>
      <button class="btn" id="discard">${esc(t('discard'))}</button><button class="btn primary" id="saveall">${esc(t('save_all'))}</button></div>`;
  const fs = el.querySelector('#fs'), fd = el.querySelector('#fd');
  fs.value = school;
  const okToSwitch = () => !pending.size || confirm(t('unsaved_leave'));
  fs.onchange = () => { if (!okToSwitch()) { fs.value = school; return; } pending.clear(); updateBar(); school = fs.value; draw(); };
  fd.onchange = () => { dept = fd.value; draw(); };           // filtering keeps unsaved edits
  let exportRows = [];
  el.querySelector('#xl').onclick = () => exportXlsx([{ name: t('nav_plan'), rows: exportRows }], 'hiring_plan');
  el.querySelector('#discard').onclick = () => { if (!confirm(t('discard_confirm'))) return; pending.clear(); updateBar(); draw(); };
  el.querySelector('#saveall').onclick = saveAll;

  function updateBar() {
    const bar = el.querySelector('#savebar');
    bar.classList.toggle('hidden', !pending.size);
    el.querySelector('#savecount').textContent = t('unsaved_n').replace('{n}', pending.size);
  }

  const sel = (sid, tid, yid, spec) => prog.filter(p => p.school_id === sid && p.job_title_id === tid && p.year_id === yid && (spec === undefined || (p.specialization || '') === spec))
    .reduce((a, x) => a + x.selected, 0);
  const dirty = (sid, tid, yid, spec) => (pending.has(pkey(sid, tid, yid, spec)) ? 'dirty' : '');

  function draw() {
    const body = el.querySelector('#body');
    const w0 = body.querySelector('.table-wrap');
    const keep = w0 && w0.dataset.school === school ? [w0.scrollLeft, w0.scrollTop, window.scrollY] : null;
    exportRows = [];
    if (school === 'all') return drawAll(body);

    const sid = Number(school);
    const rows = pos.filter(r => r.school_id === sid && (!dept || String(r.department_id) === dept))
      .sort((a, b) => ref.title[a.job_title_id].sort - ref.title[b.job_title_id].sort);
    let html = `<div class="table-wrap" data-school="${school}"><table class="plan"><thead><tr><th>${esc(t('job_title'))}</th><th class="n">${esc(t('approved'))}</th>
      <th class="n">${esc(t('current_staff'))}</th><th class="n">${esc(t('remaining'))}</th>
      ${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('planned'))} · ${esc(t('selected'))}</span></th>`).join('')}
      <th class="n">${esc(t('plan_total'))}</th><th class="n">${esc(t('gap'))}</th></tr></thead><tbody>`;
    let lastDept = null;
    for (const r of rows) {
      if (r.department_id !== lastDept) { lastDept = r.department_id; html += `<tr class="group"><td colspan="${6 + years.length}"><span class="stick">${esc(nm(ref.dept[r.department_id]))}</span></td></tr>`; }
      const tid = r.job_title_id, ti = ref.title[tid], bySpec = planBySpec(ti);
      const need = r.approved_count - r.current_staff;
      let tp = 0;
      const row = { [t('department')]: nm(ref.dept[r.department_id]), [t('job_title')]: titleName(tid), [t('approved')]: r.approved_count, [t('current_staff')]: r.current_staff, [t('remaining')]: r.remaining };
      const cells = years.map(y => {
        const specs = specsFor(sid, tid, y.id);
        const hasSpecs = specs.some(sp => sp && cellVal(sid, tid, y.id, sp) > 0);
        const total = yearTotal(sid, tid, y.id); tp += total;
        const s = sel(sid, tid, y.id);
        row[`${t('planned')} ${y.label}`] = total; row[`${t('selected')} ${y.label}`] = s;
        const tip = hasSpecs ? specs.filter(sp => cellVal(sid, tid, y.id, sp)).map(sp => `${specLabel(sp) || '—'}: ${cellVal(sid, tid, y.id, sp)}`).join('\n') : '';
        const anyDirty = specs.some(sp => pending.has(pkey(sid, tid, y.id, sp)));
        return `<td class="n" style="white-space:nowrap">
          ${editable && !hasSpecs && !bySpec
            ? `<input class="num yv ${dirty(sid, tid, y.id, '')}" type="number" min="0" value="${total || ''}" placeholder="0" data-tid="${tid}" data-y="${y.id}" data-spec="">`
            : `<b class="yv ${anyDirty ? 'dirty-text' : ''}" data-y="${y.id}" data-val="${total}" title="${esc(tip)}">${num(total)}</b>`}
          ${!bySpec && (editable || hasSpecs) ? `<button class="icon-btn" title="${esc(t('breakdown'))}" data-bd="${tid}:${y.id}">${hasSpecs ? '⋯' : '＋'}</button>` : ''}
          <span class="cell-sub">${s ? `✓ ${num(s)}` : ''}</span></td>`;
      }).join('');
      const gap = need - tp;
      row[t('plan_total')] = tp; row[t('gap')] = gap;
      exportRows.push(row);
      html += `<tr class="prow" data-tid="${tid}" ${bySpec ? 'data-byspec="1"' : ''} data-need="${need}">
        <td>${esc(titleName(tid))}${bySpec && editable ? ` <button class="btn small ghost no-print" data-addspec="${tid}">＋ ${esc(t('add_spec'))}</button>` : ''}</td>
        <td class="n">${num(r.approved_count)}</td><td class="n">${num(r.current_staff)}</td>
        <td class="n">${num(r.remaining)}</td>${cells}<td class="n tp"><b>${num(tp)}</b></td>${gapCell(gap)}</tr>`;
      if (bySpec) html += specRows(sid, r, ti);
    }
    html += `</tbody><tfoot><tr><td>${esc(t('total'))}</td><td></td><td></td><td></td>
      ${years.map(y => `<td class="n"><span class="ftot" data-y="${y.id}"></span><span class="cell-sub">✓ ${num(rows.reduce((a, r) => a + sel(sid, r.job_title_id, y.id), 0))}</span></td>`).join('')}
      <td class="n ftp"></td><td class="n fgap"></td></tr></tfoot></table></div>`;
    body.innerHTML = html;
    refreshTotals();
    if (keep) { const w = body.querySelector('.table-wrap'); w.scrollLeft = keep[0]; w.scrollTop = keep[1]; window.scrollTo(0, keep[2]); }

    // typing only records the change and updates totals — nothing is saved or redrawn
    body.querySelectorAll('input.yv').forEach(inp => inp.oninput = () => {
      setPending(sid, Number(inp.dataset.tid), Number(inp.dataset.y), inp.dataset.spec, inp.value);
      inp.classList.toggle('dirty', pending.has(pkey(sid, Number(inp.dataset.tid), Number(inp.dataset.y), inp.dataset.spec)));
      refreshTotals();
    });
    body.querySelectorAll('[data-addspec]').forEach(b => b.onclick = () => addSpec(sid, Number(b.dataset.addspec)));
    body.querySelectorAll('[data-bd]').forEach(b => b.onclick = () => { const [tid, yid] = b.dataset.bd.split(':').map(Number); breakdown(sid, tid, yid); });
  }

  const gapCell = (gap) => (gap === null
    ? '<td class="n gap"></td>'
    : `<td class="n gap ${gap > 0 ? 'pos' : gap < 0 ? 'neg' : 'zero'}" title="${gap < 0 ? esc(t('plan_exceeds')) : ''}">${num(gap)}${gap < 0 ? ' ⚠' : ''}</td>`);

  // recompute row totals, gaps, per-title totals of lab lines and the footer from what is on screen
  function refreshTotals() {
    const body = el.querySelector('#body');
    const v = (x) => (x.tagName === 'INPUT' ? (parseInt(x.value || '0', 10) || 0) : Number(x.dataset.val) || 0);
    body.querySelectorAll('tr.prow[data-byspec]').forEach(tr => {
      years.forEach(y => {
        const b = tr.querySelector(`.yv[data-y="${y.id}"]`);
        const sum = [...body.querySelectorAll(`tr.sub[data-tid="${tr.dataset.tid}"] .yv[data-y="${y.id}"]`)].reduce((a, x) => a + v(x), 0);
        b.dataset.val = sum; b.textContent = num(sum);
        b.classList.toggle('dirty-text', !!body.querySelector(`tr.sub[data-tid="${tr.dataset.tid}"] .yv.dirty[data-y="${y.id}"]`));
      });
    });
    let ftp = 0, fgap = 0;
    body.querySelectorAll('tr.prow, tr.sub[data-tid]').forEach(tr => {
      const tp = [...tr.querySelectorAll('.yv')].reduce((a, x) => a + v(x), 0);
      tr.querySelector('.tp').innerHTML = `<b>${num(tp)}</b>`;
      if (tr.dataset.need !== undefined && tr.dataset.need !== '') {
        const gap = Number(tr.dataset.need) - tp;
        tr.querySelector('.gap').outerHTML = gapCell(gap);
        if (tr.classList.contains('prow')) fgap += Math.max(0, gap);
      }
      if (tr.classList.contains('prow')) ftp += tp;
    });
    years.forEach(y => {
      const f = body.querySelector(`.ftot[data-y="${y.id}"]`);
      if (f) f.textContent = num([...body.querySelectorAll(`tr.prow .yv[data-y="${y.id}"]`)].reduce((a, x) => a + v(x), 0));
    });
    const ft = body.querySelector('.ftp'); if (ft) ft.textContent = num(ftp);
    const fg = body.querySelector('.fgap'); if (fg) fg.textContent = num(fgap);
  }

  // ---------- lines per lab / specialisation (Specialised Labs Engineer, Lab Technician) ----------
  function specList(sid, ti) {
    const fromLabs = ti.per_lab ? schoolLabs(sid).map(l => l.name) : [];
    const fromPlan = plan.filter(p => p.school_id === sid && p.job_title_id === ti.id).map(p => p.specialization);
    const fromProg = prog.filter(p => p.school_id === sid && p.job_title_id === ti.id && p.selected).map(p => p.specialization || '');
    const fromPending = [...pending.keys()].map(k => k.split('|')).filter(k => +k[0] === sid && +k[1] === ti.id).map(k => k.slice(3).join('|'));
    const named = [...new Set([...fromLabs, ...fromPlan, ...fromProg, ...fromPending, ...(extraSpecs[`${sid}:${ti.id}`] || [])])].filter(s => s);
    // '' = selected candidates whose lab was not recorded (shown read-only, not part of the plan)
    return [...named, ...(fromProg.includes('') ? [''] : [])];
  }
  function specRows(sid, r, ti) {
    const specs = specList(sid, ti);
    const labs = ti.per_lab ? schoolLabs(sid) : [];
    if (!specs.length) return `<tr class="sub"><td colspan="${6 + years.length}"><span class="muted">${esc(t('spec_plan_hint'))}</span></td></tr>`;
    return specs.map(spec => {
      const lab = labs.find(l => l.name === spec);
      const selAll = years.reduce((a, y) => a + sel(sid, ti.id, y.id, spec), 0);
      const need = lab ? lab.approved_count - lab.current_staff : null;
      let tp = 0;
      const exp = {};
      if (!spec) {   // read-only: candidates selected without a lab
        return `<tr class="sub unassigned"><td>${esc(t('lab_not_recorded'))}</td><td class="n"></td><td class="n"></td><td class="n"></td>
          ${years.map(y => { const se = sel(sid, ti.id, y.id, ''); return `<td class="n"><span class="cell-sub">${se ? `✓ ${num(se)}` : ''}</span></td>`; }).join('')}
          <td class="n"></td><td class="n"></td></tr>`;
      }
      const cells = years.map(y => {
        const pl = cellVal(sid, ti.id, y.id, spec), se = sel(sid, ti.id, y.id, spec);
        tp += pl; exp[`${t('planned')} ${y.label}`] = pl; exp[`${t('selected')} ${y.label}`] = se;
        return `<td class="n" style="white-space:nowrap">${editable
          ? `<input class="num yv ${dirty(sid, ti.id, y.id, spec)}" type="number" min="0" value="${pl || ''}" placeholder="0" data-tid="${ti.id}" data-y="${y.id}" data-spec="${esc(spec)}">`
          : `<b class="yv" data-y="${y.id}" data-val="${pl}">${num(pl)}</b>`}<span class="cell-sub">${se ? `✓ ${num(se)}` : ''}</span></td>`;
      }).join('');
      const gap = need === null ? null : need - tp;
      exportRows.push({ [t('department')]: nm(ref.dept[r.department_id]), [t('job_title')]: `   ↳ ${spec ? specLabel(spec) : t('not_specified')}`,
        [t('approved')]: lab ? lab.approved_count : '', [t('current_staff')]: lab ? lab.current_staff : '', [t('remaining')]: lab ? need - selAll : '',
        ...exp, [t('plan_total')]: tp, [t('gap')]: gap ?? '' });
      return `<tr class="sub ${spec ? '' : 'unassigned'}" data-tid="${ti.id}" data-need="${need ?? ''}"><td>${esc(spec ? specLabel(spec) : t('not_specified'))}</td>
        <td class="n">${lab ? num(lab.approved_count) : '<span class="muted">–</span>'}</td><td class="n">${lab ? num(lab.current_staff) : '<span class="muted">–</span>'}</td>
        <td class="n">${lab ? num(need - selAll) : '<span class="muted">–</span>'}</td>${cells}<td class="n tp"><b>${num(tp)}</b></td>${gapCell(gap)}</tr>`;
    }).join('');
  }
  function addSpec(sid, tid) {
    modal({
      title: `${t('add_spec')}: ${titleName(tid)} — ${schoolName(sid)}`,
      body: `<label>${esc(t('lab_or_spec'))}<select id="newspec">${labOptions('', t('choose_lab'))}</select></label>`,
      saveLabel: t('add'),
      onSave: async (w) => {
        const v = w.querySelector('#newspec').value;
        if (!v) return false;
        const k = `${sid}:${tid}`;
        extraSpecs[k] = [...new Set([...(extraSpecs[k] || []), v])];
        draw();
      },
    });
  }

  // breakdown of a normal title's yearly number by specialisation — also kept as unsaved edits
  function breakdown(sid, tid, yid) {
    const specs = specsFor(sid, tid, yid).filter(sp => cellVal(sid, tid, yid, sp) > 0);
    const rows = specs.length ? specs.map(sp => ({ specialization: sp, planned_count: cellVal(sid, tid, yid, sp) })) : [{ specialization: '', planned_count: 0 }];
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
      saveLabel: t('apply'),
      onSave: editable ? async (w) => {
        const merged = {};
        [...w.querySelectorAll('.spec-row')].forEach(r => {
          const sp = r.querySelector('.spec').value.trim();
          merged[sp] = (merged[sp] || 0) + (parseInt(r.querySelector('.cnt').value || '0', 10) || 0);
        });
        for (const sp of specsFor(sid, tid, yid)) if (!(sp in merged)) setPending(sid, tid, yid, sp, 0);
        for (const [sp, n] of Object.entries(merged)) setPending(sid, tid, yid, sp, n);
        draw();
      } : null,
    });
    const wire = () => m.el.querySelectorAll('.rm').forEach(b => b.onclick = () => b.closest('.spec-row').remove());
    wire();
    const add = m.el.querySelector('#addspec');
    if (add) add.onclick = () => { m.el.querySelector('#specs').insertAdjacentHTML('beforeend', rowHtml({ specialization: '', planned_count: 0 })); wire(); };
  }

  // ---------- save everything at once ----------
  async function saveAll() {
    const btn = el.querySelector('#saveall');
    btn.disabled = true;
    try {
      const now = new Date().toISOString();
      const ups = [], dels = [];
      for (const [k, n] of pending) {
        const [sid, tid, yid, ...rest] = k.split('|');
        const spec = rest.join('|');
        const ex = plan.find(p => p.school_id === +sid && p.job_title_id === +tid && p.year_id === +yid && p.specialization === spec);
        if (n > 0) ups.push({ school_id: +sid, job_title_id: +tid, year_id: +yid, specialization: spec, planned_count: n, updated_at: now, updated_by: state.profile.id });
        else if (ex) dels.push(ex.id);
      }
      if (ups.length) await db.upsert('hiring_plan', ups, 'school_id,job_title_id,year_id,specialization');
      for (const id of dels) await db.remove('hiring_plan', id);
      const n = pending.size;
      [plan, prog] = await Promise.all([
        db.list('hiring_plan', { eq: { school_id: locked || undefined } }),
        db.list('v_plan_status', { eq: { school_id: locked || undefined } }),
      ]);
      pending.clear(); updateBar(); draw();
      toast(t('saved_n').replace('{n}', n));
    } catch (e) { fail(e); } finally { btn.disabled = false; }
  }

  function drawAll(body) {
    const sumP = (rows) => rows.reduce((a, x) => a + x.planned_count, 0);
    body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>${esc(t('school'))}</th><th class="n">${esc(t('approved'))}</th><th class="n">${esc(t('current_staff'))}</th>
      <th class="n">${esc(t('remaining'))}</th>${years.map(y => `<th class="n">${esc(y.label)}<span class="cell-sub">${esc(t('selected'))} / ${esc(t('planned'))}</span></th>`).join('')}
      <th class="n">${esc(t('plan_total'))}</th><th class="n">${esc(t('gap'))}</th></tr></thead><tbody>
      ${ref.schools.map(s => {
        const P = pos.filter(r => r.school_id === s.id && (!dept || String(r.department_id) === dept));
        const tids = new Set(P.map(r => r.job_title_id));
        const a = P.reduce((x, r) => x + r.approved_count, 0), c = P.reduce((x, r) => x + r.current_staff, 0);
        const rem = P.reduce((x, r) => x + Math.max(0, r.remaining), 0);
        const ys = years.map(y => ({
          pl: sumP(plan.filter(p => p.school_id === s.id && p.year_id === y.id && tids.has(p.job_title_id))),
          se: prog.filter(p => p.school_id === s.id && p.year_id === y.id && tids.has(p.job_title_id)).reduce((x, r) => x + r.selected, 0),
        }));
        const tp = ys.reduce((x, y) => x + y.pl, 0);
        const row = { [t('school')]: nm(s), [t('approved')]: a, [t('current_staff')]: c, [t('remaining')]: rem };
        years.forEach((y, i) => { row[`${t('planned')} ${y.label}`] = ys[i].pl; row[`${t('selected')} ${y.label}`] = ys[i].se; });
        row[t('plan_total')] = tp; row[t('gap')] = Math.max(0, (a - c) - tp);
        exportRows.push(row);
        return `<tr class="clickable" data-s="${s.id}"><td>${esc(nm(s))}</td><td class="n">${num(a)}</td><td class="n">${num(c)}</td><td class="n">${num(rem)}</td>
          ${ys.map(y => `<td class="n">${num(y.se)} / ${num(y.pl)}</td>`).join('')}<td class="n"><b>${num(tp)}</b></td>
          <td class="n ${(a - c) - tp > 0 ? 'pos' : 'zero'}">${num(Math.max(0, (a - c) - tp))}</td></tr>`;
      }).join('')}</tbody></table></div>`;
    body.querySelectorAll('tr[data-s]').forEach(tr => tr.onclick = () => { school = tr.dataset.s; fs.value = school; draw(); });
  }

  updateBar();
  draw();
}
