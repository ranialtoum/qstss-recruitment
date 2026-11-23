// Candidate profile: data, vacancy, full employment journey, interviews, history
import { db } from '../api.js';
import { state, t, en, esc, num, fmtDate, today, can, schoolName, titleName, deptName, yearLabel, stageBadge, resultBadge,
  ratingBadge, vacancyBadge, modal, toast, fail, readForm, role, specLabel, isLabTitle, panelHtml, ageOf, uniLabel } from '../core.js';
import { openCandidateForm } from './candidate_form.js';

const STEPS = [
  { key: 'offer', label: 'step_offer', field: 'offer_status', date: 'offer_date', perm: 'manage',
    ready: c => c.interview_result === 'accepted', good: ['accepted'], bad: ['declined'], wait: ['pending'] },
  { key: 'documents', label: 'step_documents', field: 'documents_status', date: 'documents_date', perm: 'onboarding',
    ready: c => c.offer_status === 'accepted', good: ['complete'], bad: [], wait: ['incomplete'] },
  { key: 'hire', label: 'step_hire', field: 'hire_status', date: 'hire_date', perm: 'onboarding',
    ready: c => c.documents_status === 'complete', good: ['hired'], bad: ['not_hired'], wait: ['in_progress'] },
  { key: 'start', label: 'step_start', field: 'start_status', date: 'start_date', perm: 'onboarding',
    ready: c => c.hire_status === 'hired', good: ['started'], bad: ['not_started'], wait: [] },
  { key: 'probation', label: 'step_probation', field: 'probation_status', date: 'probation_end_date', perm: 'onboarding',
    ready: c => c.start_status === 'started', good: ['passed'], bad: ['failed'], wait: ['in_probation'] },
  { key: 'confirm', label: 'step_confirm', field: 'confirmed', date: 'confirmed_date', perm: 'onboarding', bool: true,
    ready: c => c.probation_status === 'passed', good: [true], bad: [], wait: [] },
];

export async function render(el, ctx) {
  const id = ctx.id;
  const [c, interviews, events] = await Promise.all([
    db.get('candidates', id),
    db.list('interviews', { eq: { candidate_id: id }, order: [['interview_date', false]] }),
    db.list('candidate_events', { eq: { candidate_id: id }, order: [['created_at', false]] }),
  ]);
  if (!ctx.seq()) return;
  if (!c) { el.innerHTML = `<div class="notice err">${esc(t('no_records'))}</div>`; return; }
  let vac = null;
  if (c.school_id && c.job_title_id) [vac] = await db.list('v_position_status', { eq: { school_id: c.school_id, job_title_id: c.job_title_id } });

  const mine = c.created_by === state.profile.id;
  const canEdit = can('manage') || (role() === 'interviewer' && mine);
  const canStep = (p) => can(p) && !(role() === 'principal' && c.school_id !== state.profile.school_id);
  const reload = () => render(el, ctx);
  const latest = interviews[0];

  el.innerHTML = `
    <div class="page-head">
      <div><a href="#/candidates" class="muted">← ${esc(t('candidates'))}</a>
        <h2 style="margin-top:.3rem">${esc(c.full_name)} <small class="muted">#${c.ref_no}</small></h2>
        <div class="row">${stageBadge(c.stage)} ${ratingBadge(c.last_score, latest?.rating)} ${c.withdrawn ? `<span class="badge tone-grey">${esc(t('withdrawn'))}</span>` : ''}</div></div>
      <div class="row">
        ${canEdit ? `<button class="btn" id="edit">${esc(t('edit'))}</button>` : ''}
        ${can('interview') ? `<a class="btn primary" href="#/interview/new?candidate=${c.id}">＋ ${esc(t('add_interview'))}</a>` : ''}
        ${can('manage') ? `<button class="btn" id="wd">${esc(c.withdrawn ? t('undo') + ' – ' + t('withdrawn') : t('withdraw'))}</button>` : ''}
        ${can('admin') ? `<button class="btn danger" id="del">${esc(t('delete'))}</button>` : ''}
        <button class="btn" onclick="window.print()">${esc(t('print'))}</button>
      </div>
    </div>
    <div class="detail-grid">
      <div>
        <div class="card"><h3>${esc(t('profile'))}</h3>
          <div class="facts">
            ${fact(t('job_title'), titleName(c.job_title_id))}${fact(t('department'), c.job_title_id ? deptName(state.ref.title[c.job_title_id]?.department_id) : '')}
            ${fact(isLabTitle(c.job_title_id) ? t('lab') : t('specialization'), specLabel(c.specialization))}${fact(t('school'), schoolName(c.school_id))}${fact(t('year'), yearLabel(c.year_id))}
            ${fact(t('cv_source'), [en('cv_source', c.cv_source), c.cv_source_detail].filter(Boolean).join(' – '))}
            ${fact(t('gender'), en('gender', c.gender))}${fact(t('nationality'), c.nationality)}
            ${state.ref.candQ ? `${fact(t('birth_date'), c.birth_date ? `${fmtDate(c.birth_date)} · ${ageOf(c.birth_date)} ${t('years_old')}` : '')}
              ${fact(t('born_in_qatar'), c.born_in_qatar === null || c.born_in_qatar === undefined ? '' : en('yes_no', c.born_in_qatar))}
              ${fact(t('qatari_mother'), c.qatari_mother === null || c.qatari_mother === undefined ? '' : en('yes_no', c.qatari_mother))}
              ${fact(t('qatar_graduate'), c.qatar_graduate === null || c.qatar_graduate === undefined ? '' : en('yes_no', c.qatar_graduate) + (c.qatar_graduate && c.qatar_university ? ` – ${uniLabel(c.qatar_university)}` : ''))}` : ''}
            ${fact(t('email_addr'), c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '', true)}
            ${fact(t('phone'), c.phone ? `<span dir="ltr">${esc(c.phone)}</span>` : '', true)}
            ${fact(t('inside_qatar'), c.inside_qatar === null ? '' : en('inside_qatar', c.inside_qatar))}${fact(t('residence_country'), c.residence_country)}
            ${fact(t('visa_status'), en('visa_status', c.visa_status))}${fact(t('marital_status'), en('marital_status', c.marital_status))}
            ${fact(t('sons'), num(c.sons))}${fact(t('daughters'), num(c.daughters))}${fact(t('total_children'), num(c.total_children))}
            ${fact(t('qualification'), c.qualification)}${fact(t('years_experience'), c.years_experience)}${fact(t('current_employer'), c.current_employer)}
            ${fact(t('cv_url'), c.cv_url ? `<a href="${esc(c.cv_url)}" target="_blank" rel="noopener">${esc(t('open'))} ↗</a>` : '', true)}
            ${fact(t('created'), fmtDate(c.created_at))}
          </div>
          ${c.notes ? `<p style="margin-top:.8rem"><b>${esc(t('notes'))}:</b> ${esc(c.notes)}</p>` : ''}
          ${vac ? `<div class="vacancy-box"><div class="big">${num(vac.remaining)}</div><div><div>${esc(t('remaining_for_title'))}</div>
            ${vacancyBadge(vac.remaining)} <small>${esc(t('approved'))} ${num(vac.approved_count)} · ${esc(t('current_staff'))} ${num(vac.current_staff)} · ${esc(t('selected'))} ${num(vac.selected)}</small></div></div>` : ''}
        </div>
        <div class="card"><h3>${esc(t('interviews'))} (${interviews.length})</h3>
          ${interviews.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('date'))}</th><th>${esc(t('job_title'))}</th><th>${esc(t('source'))}</th>
            <th>${esc(t('rating'))}</th><th>${esc(t('interview_result'))}</th></tr></thead><tbody>
            ${interviews.map(i => `<tr class="clickable" data-i="${i.id}"><td>${fmtDate(i.interview_date)}</td><td>${esc(titleName(i.job_title_id))}</td>
              <td>${esc(en('cv_source', i.source))}${i.mode ? ` · ${esc(en('mode', i.mode))}` : ''}${(i.interviewers || (i.panel || []).length) ? `<span class="cell-sub">${panelHtml(i)}</span>` : ''}</td>
              <td>${ratingBadge(i.overall_score, i.rating)}</td><td>${resultBadge(i.result)}</td></tr>`).join('')}</tbody></table></div>`
            : `<div class="empty">${esc(t('no_records'))}</div>`}
        </div>
      </div>
      <div>
        <div class="card"><h3>${esc(t('journey'))}</h3><ol class="steps" id="steps"></ol></div>
        <div class="card"><h3>${esc(t('timeline'))}</h3>
          <ul class="timeline">${events.map(ev => `<li><time>${new Date(ev.created_at).toLocaleString(state.lang === 'ar' ? 'ar-QA-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</time>
            <div><b>${esc(en('event', ev.event))}</b>${ev.event !== 'created' ? `: ${eventVal(ev.event, ev.old_value)} → ${eventVal(ev.event, ev.new_value)}` : ''}
            ${ev.actor_name ? `<span class="cell-sub">${esc(ev.actor_name)}</span>` : ''}</div></li>`).join('')}</ul></div>
      </div>
    </div>`;

  el.querySelectorAll('tr[data-i]').forEach(tr => tr.onclick = () => { location.hash = `#/interview/${tr.dataset.i}`; });
  if (canEdit) el.querySelector('#edit').onclick = () => openCandidateForm(c, reload);
  if (can('admin')) el.querySelector('#del').onclick = async () => {
    if (!confirm(t('confirm_delete'))) return;
    try { await db.remove('candidates', c.id); location.hash = '#/candidates'; } catch (e) { fail(e); }
  };
  if (can('manage')) el.querySelector('#wd').onclick = () => {
    if (c.withdrawn) return save({ withdrawn: false, withdrawn_reason: null });
    modal({ title: t('withdraw'), body: `<label>${esc(t('withdrawn_reason'))}<input name="withdrawn_reason"></label>`,
      onSave: async (m) => save({ withdrawn: true, ...readForm(m) }) });
  };

  async function save(patch) {
    try { await db.update('candidates', c.id, patch); toast(t('saved')); reload(); } catch (e) { fail(e); }
  }

  // ---- journey stepper ----
  const ol = el.querySelector('#steps');
  const ir = c.interview_result;
  let html = `<li><div class="dot ${ir === 'accepted' ? 'done' : ir === 'rejected' ? 'bad' : 'wait'}">1</div><div>
    <div class="step-head"><b>${esc(t('step_interview'))}</b>${resultBadge(ir)}</div>
    <small class="muted">${latest ? `${fmtDate(latest.interview_date)} · ${esc(titleName(latest.job_title_id))}` : esc(t('not_set'))}</small></div></li>`;
  STEPS.forEach((s, i) => {
    const val = c[s.field];
    const ready = s.ready(c);
    const state_ = s.good.includes(val) ? 'done' : s.bad.includes(val) ? 'bad' : (val !== null && val !== undefined && val !== false) ? 'wait' : '';
    const editable = ready && canStep(s.perm) && !c.resigned;
    const display = s.bool ? (val ? `<span class="badge tone-green">${esc(t('yes'))}</span>` : '') : (val ? `<span class="badge tone-${state_ === 'done' ? 'green' : state_ === 'bad' ? 'red' : 'amber'}">${esc(en(s.field, val))}</span>` : '');
    html += `<li class="${ready ? '' : 'step-locked'}"><div class="dot ${state_}">${i + 2}</div><div>
      <div class="step-head"><b>${esc(t(s.label))}</b><span class="row">${display}${c[s.date] ? `<small class="muted">${fmtDate(c[s.date])}</small>` : ''}
        ${editable ? `<button class="btn small" data-open="${s.key}">${esc(t('update_step'))}</button>` : ''}</span></div>
      ${!ready && !val ? `<small class="muted">${esc(t('step_locked'))}</small>` : ''}
      <div class="step-form" data-form="${s.key}">
        <label>${esc(t('status'))}<select name="${s.field}" ${s.bool ? 'data-type="bool"' : ''}>
          ${s.bool ? `<option value="false">${esc(t('no'))}</option><option value="true" ${val ? 'selected' : ''}>${esc(t('yes'))}</option>`
            : `<option value="">${esc(t('not_set'))}</option>` + Object.keys(enumGroup(s.field)).map(k => `<option value="${k}" ${val === k ? 'selected' : ''}>${esc(en(s.field, k))}</option>`).join('')}
        </select></label>
        <label>${esc(t('date'))}<input type="date" name="${s.date}" value="${c[s.date] || today()}"></label>
        <button class="btn primary small" data-save="${s.key}">${esc(t('save'))}</button></div></div></li>`;
  });
  // resignation
  const canResign = c.hire_status === 'hired' && canStep('onboarding');
  html += `<li class="${c.hire_status === 'hired' ? '' : 'step-locked'}"><div class="dot ${c.resigned ? 'bad' : ''}">${STEPS.length + 2}</div><div>
    <div class="step-head"><b>${esc(t('step_resign'))}</b><span class="row">${c.resigned ? `<span class="badge tone-red">${esc(en('stage', 'resigned'))}</span> <small class="muted">${fmtDate(c.resignation_date)}</small>` : ''}
    ${canResign ? `<button class="btn small" data-open="resign">${esc(c.resigned ? t('undo') : t('update_step'))}</button>` : ''}</span></div>
    ${c.resignation_reason ? `<small>${esc(c.resignation_reason)}</small>` : ''}
    <div class="step-form" data-form="resign">
      <label>${esc(t('date'))}<input type="date" name="resignation_date" value="${c.resignation_date || today()}"></label>
      <label>${esc(t('resignation_reason'))}<input name="resignation_reason" value="${esc(c.resignation_reason || '')}"></label>
      <button class="btn primary small" data-save="resign">${esc(c.resigned ? t('undo') : t('save'))}</button></div></div></li>`;
  ol.innerHTML = html;

  ol.querySelectorAll('[data-open]').forEach(b => b.onclick = () => ol.querySelector(`[data-form="${b.dataset.open}"]`).classList.toggle('open'));
  ol.querySelectorAll('[data-save]').forEach(b => b.onclick = async () => {
    const k = b.dataset.save;
    const form = ol.querySelector(`[data-form="${k}"]`);
    const v = readForm(form);
    if (k === 'resign') {
      if (c.resigned) return save({ resigned: false, resignation_date: null, resignation_reason: null });
      if (!confirm(t('confirm_resign'))) return;
      return save({ resigned: true, ...v });
    }
    const s = STEPS.find(x => x.key === k);
    if (!v[s.field] && !s.bool) v[s.date] = null;
    // clearing a step clears the steps after it
    const after = STEPS.slice(STEPS.indexOf(s) + 1);
    const positive = s.good.includes(v[s.field]);
    if (!positive) after.forEach(a => { if (c[a.field] !== null && c[a.field] !== false) { v[a.field] = a.bool ? false : null; v[a.date] = null; } });
    save(v);
  });
}

const enumGroup = (field) => ({
  offer_status: { pending: 1, accepted: 1, declined: 1 }, documents_status: { incomplete: 1, complete: 1 },
  hire_status: { in_progress: 1, hired: 1, not_hired: 1 }, start_status: { started: 1, not_started: 1 },
  probation_status: { in_probation: 1, passed: 1, failed: 1 },
}[field]);

function fact(label, value, raw = false) {
  if (value === null || value === undefined || value === '') value = '<span class="muted">—</span>', raw = true;
  return `<div><span>${esc(label)}</span><b>${raw ? value : esc(value)}</b></div>`;
}

function eventVal(event, v) {
  if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
  if (event === 'school_id') return esc(schoolName(Number(v)));
  if (event === 'job_title_id') return esc(titleName(Number(v)));
  if (event === 'year_id') return esc(yearLabel(Number(v)));
  if (event === 'interview_result') return esc(en('result', v));
  if (['stage', 'offer_status', 'documents_status', 'hire_status', 'start_status', 'probation_status'].includes(event)) return esc(en(event, v));
  if (v === 'true') return esc(t('yes')); if (v === 'false') return esc(t('no'));
  return esc(v);
}
