// Admin settings: academic years, interview criteria, job titles, labs
import { db } from '../api.js';
import { state, t, en, esc, nm, options, loadRef, toast, fail, schoolName } from '../core.js';
import { ENUMS } from '../i18n.js';

let tab = 'years';

export async function render(el, ctx) {
  const ref = state.ref;
  el.innerHTML = `
    <div class="page-head"><h2>${esc(t('nav_settings'))}</h2></div>
    <div class="tabs" id="tabs">${['years', 'rubrics', 'titles'].map(k => `<button data-t="${k}" class="${k === tab ? 'active' : ''}">${esc(t('settings_' + k))}</button>`).join('')}</div>
    <div id="body"></div>`;
  el.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(el, ctx); });
  const body = el.querySelector('#body');
  const refresh = async () => { await loadRef(); render(el, ctx); };
  const act = (fn) => async (...a) => { try { await fn(...a); toast(t('saved')); await refresh(); } catch (e) { fail(e); } };

  if (tab === 'years') {
    body.innerHTML = `<div class="card"><div class="table-wrap"><table><thead><tr><th>${esc(t('year'))}</th><th></th><th></th></tr></thead><tbody>
      ${ref.years.map(y => `<tr><td><b>${esc(y.label)}</b></td><td>${y.is_baseline ? `<span class="badge tone-grey">${esc(t('baseline'))}</span>` : ''}
        ${y.is_current ? `<span class="badge tone-green">${esc(t('current'))}</span>` : ''}</td>
        <td>${!y.is_baseline && !y.is_current ? `<button class="btn small" data-cur="${y.id}">${esc(t('set_current'))}</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div><button class="btn" id="addy" style="margin-top:.8rem">＋ ${esc(t('add_year'))}</button></div>`;
    body.querySelectorAll('[data-cur]').forEach(b => b.onclick = act(async () => {
      for (const y of ref.years.filter(x => x.is_current)) await db.update('academic_years', y.id, { is_current: false });
      await db.update('academic_years', Number(b.dataset.cur), { is_current: true });
    }));
    body.querySelector('#addy').onclick = act(async () => {
      const last = Math.max(...ref.years.map(y => y.start_year));
      await db.insert('academic_years', { label: `${last + 1}/${last + 2}`, start_year: last + 1 });
    });
    return;
  }

  if (tab === 'rubrics') {
    const sel = ctx.params.rubric || ref.rubrics[0]?.key;
    const isTitle = String(sel).startsWith('t:');
    const list = ref.criteria.filter(c => (isTitle ? c.job_title_id === Number(sel.slice(2)) : c.rubric_key === sel));
    const sumW = list.filter(c => c.active !== false).reduce((a, c) => a + Number(c.weight), 0);
    const usedBy = isTitle ? [] : ref.titles.filter(x => x.rubric_key === sel);
    body.innerHTML = `<div class="toolbar"><label class="wide">${esc(t('criteria_for'))}<select id="rs">
        <optgroup label="${esc(t('rubric'))}">${ref.rubrics.map(r => `<option value="${r.key}" ${r.key === sel ? 'selected' : ''}>${esc(nm(r))}</option>`).join('')}</optgroup>
        <optgroup label="${esc(t('title_specific'))}">${ref.titles.map(x => `<option value="t:${x.id}" ${`t:${x.id}` === sel ? 'selected' : ''}>${esc(nm(x))}</option>`).join('')}</optgroup>
      </select></label></div>
      <div class="card">
        ${usedBy.length ? `<p class="muted">${esc(t('job_title'))}: ${usedBy.map(x => esc(nm(x))).join(' · ')}</p>` : ''}
        <div class="table-wrap"><table><thead><tr><th>${esc(t('name_en'))}</th><th>${esc(t('name_ar'))}</th><th>${esc(t('hint_en'))}</th><th>${esc(t('hint_ar'))}</th>
          <th class="n">${esc(t('weight'))}</th><th>${esc(t('active'))}</th><th></th></tr></thead><tbody id="rows">
          ${list.map(c => row(c)).join('')}</tbody>
          <tfoot><tr><td colspan="4">${esc(t('weights_sum'))} ${isTitle ? '' : '(= 100)'}</td><td class="n ${!isTitle && sumW !== 100 ? 'neg' : ''}">${sumW}</td><td colspan="2"></td></tr></tfoot></table></div>
        <button class="btn" id="addc" style="margin-top:.8rem">＋ ${esc(t('add_row'))}</button>
        <p class="muted">${esc(state.lang === 'ar' ? 'الدرجة المحسوبة = مجموع (الوزن × الدرجة ÷ 5) للبنود المقيّمة، مقسوماً على مجموع أوزانها × 100. البنود الخاصة بمسمى وظيفي تضاف إلى نموذجه.' : 'Rubric score = Σ(weight × score ÷ 5) over scored criteria ÷ Σ their weights × 100. Title-specific criteria are added to that title’s rubric.')}</p>
      </div>`;
    body.querySelector('#rs').onchange = (e) => { ctx.params.rubric = e.target.value; render(el, ctx); };
    function row(c) {
      return `<tr data-id="${c.id || ''}"><td><input name="name_en" value="${esc(c.name_en || '')}"></td><td><input name="name_ar" value="${esc(c.name_ar || '')}" dir="rtl"></td>
        <td><input name="hint_en" value="${esc(c.hint_en || '')}"></td><td><input name="hint_ar" value="${esc(c.hint_ar || '')}" dir="rtl"></td>
        <td><input class="num" name="weight" type="number" min="1" value="${c.weight ?? 10}"></td>
        <td><input type="checkbox" name="active" ${c.active !== false ? 'checked' : ''}></td>
        <td><button class="btn small" data-save>${esc(t('save'))}</button></td></tr>`;
    }
    const wire = () => body.querySelectorAll('[data-save]').forEach(b => b.onclick = act(async () => {
      const tr = b.closest('tr');
      const v = Object.fromEntries([...tr.querySelectorAll('[name]')].map(i => [i.name, i.type === 'checkbox' ? i.checked : i.value.trim() || null]));
      v.weight = Number(v.weight) || 10;
      if (!v.name_en || !v.name_ar) throw new Error(t('required'));
      if (tr.dataset.id) await db.update('rubric_criteria', Number(tr.dataset.id), v);
      else await db.insert('rubric_criteria', { ...v, key: v.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) + '_' + Date.now().toString(36),
        sort: list.length + 1, ...(isTitle ? { job_title_id: Number(sel.slice(2)) } : { rubric_key: sel }) });
    }));
    wire();
    body.querySelector('#addc').onclick = () => { body.querySelector('#rows').insertAdjacentHTML('beforeend', row({})); wire(); };
    return;
  }

  if (tab === 'titles') {
    body.innerHTML = `<div class="card"><div class="table-wrap"><table><thead><tr><th>${esc(t('department'))}</th><th>${esc(t('name_en'))}</th><th>${esc(t('name_ar'))}</th>
      <th>${esc(t('category'))}</th><th>${esc(t('rubric'))}</th><th>${esc(t('active'))}</th><th></th></tr></thead><tbody id="rows">
      ${ref.titles.map(row).join('')}</tbody></table></div>
      <button class="btn" id="addt" style="margin-top:.8rem">＋ ${esc(t('add'))}</button></div>`;
    function row(x) {
      return `<tr data-id="${x.id || ''}"><td><select name="department_id">${options(ref.departments, x.department_id)}</select></td>
        <td><input name="name_en" value="${esc(x.name_en || '')}"></td><td><input name="name_ar" value="${esc(x.name_ar || '')}" dir="rtl"></td>
        <td><select name="category">${Object.keys(ENUMS.category).map(k => `<option value="${k}" ${x.category === k ? 'selected' : ''}>${esc(en('category', k))}</option>`).join('')}</select></td>
        <td><select name="rubric_key">${options(ref.rubrics, x.rubric_key, { value: 'key', empty: '—' })}</select></td>
        <td><input type="checkbox" name="active" ${x.active !== false ? 'checked' : ''}></td>
        <td><button class="btn small" data-save>${esc(t('save'))}</button></td></tr>`;
    }
    const wire = () => body.querySelectorAll('[data-save]').forEach(b => b.onclick = act(async () => {
      const tr = b.closest('tr');
      const v = Object.fromEntries([...tr.querySelectorAll('[name]')].map(i => [i.name, i.type === 'checkbox' ? i.checked : i.value.trim() || null]));
      v.department_id = Number(v.department_id);
      if (!v.name_en || !v.name_ar) throw new Error(t('required'));
      if (tr.dataset.id) await db.update('job_titles', Number(tr.dataset.id), v);
      else {
        const nt = await db.insert('job_titles', { ...v, sort: ref.titles.length + 1 });
        // add the new title to every school's structure with 0 approved
        await db.upsert('school_positions', ref.schools.map(s => ({ school_id: s.id, job_title_id: nt.id, approved_count: 0, current_staff: 0 })), 'school_id,job_title_id');
      }
    }));
    wire();
    body.querySelector('#addt').onclick = () => { body.querySelector('#rows').insertAdjacentHTML('beforeend', row({ category: 'academic' })); wire(); };
    return;
  }

  if (tab === 'labs') {
    body.innerHTML = `<div class="cards">${ref.schools.map(s => `<div class="card"><h3>${esc(nm(s))}</h3>
      <table><tbody>${ref.labs.filter(l => l.school_id === s.id).map(l => `<tr><td>${esc(l.name)}</td><td class="n">${l.staff_count || ''}</td>
        <td><button class="icon-btn" data-del="${l.id}" title="${esc(t('delete'))}">✕</button></td></tr>`).join('')}</tbody></table>
      <div class="row" style="margin-top:.5rem"><input placeholder="${esc(t('lab_name'))}" data-new="${s.id}"><input class="num" type="number" min="0" placeholder="${esc(t('staff_count'))}" data-cnt="${s.id}">
        <button class="btn small" data-add="${s.id}">＋</button></div></div>`).join('')}</div>`;
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = act(async () => db.remove('school_labs', Number(b.dataset.del))));
    body.querySelectorAll('[data-add]').forEach(b => b.onclick = act(async () => {
      const sid = Number(b.dataset.add);
      const name = body.querySelector(`[data-new="${sid}"]`).value.trim();
      if (!name) throw new Error(t('required'));
      await db.insert('school_labs', { school_id: sid, name, staff_count: Number(body.querySelector(`[data-cnt="${sid}"]`).value) || 0 });
    }));
    void schoolName;
  }
}
