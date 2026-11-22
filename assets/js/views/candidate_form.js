// Candidate create / edit form (used from the list, the detail page and the interview page)
import { db } from '../api.js';
import { state, t, esc, enumOptions, titleOptions, options, modal, readForm, validate, toast, lockedSchool, visibleSchools,
  vacancyBadge, num, labOptions, isLabTitle } from '../core.js';

export const NATIONALITIES = ['Qatari', 'Jordanian', 'Palestinian', 'Egyptian', 'Syrian', 'Lebanese', 'Tunisian', 'Moroccan', 'Algerian',
  'Sudanese', 'Iraqi', 'Yemeni', 'Omani', 'Saudi', 'Emirati', 'Bahraini', 'Kuwaiti', 'Indian', 'Pakistani', 'Filipino', 'Sri Lankan',
  'Bangladeshi', 'Nepali', 'British', 'American', 'Canadian', 'Irish', 'South African', 'Australian', 'Kenyan', 'Nigerian', 'Turkish'];

export function candidateFields(c = {}, { compact = false } = {}) {
  const ref = state.ref;
  const lockedS = lockedSchool();
  return `
  <datalist id="nat-list">${NATIONALITIES.map(n => `<option value="${n}">`).join('')}</datalist>
  <datalist id="spec-list"></datalist>
  <fieldset><legend>${esc(t('sec_personal'))}</legend><div class="grid3">
    <label class="span2">${esc(t('full_name'))} *<input name="full_name" required value="${esc(c.full_name || '')}"></label>
    <label>${esc(t('gender'))}<select name="gender">${enumOptions('gender', c.gender)}</select></label>
    <label>${esc(t('nationality'))}<input name="nationality" list="nat-list" value="${esc(c.nationality || '')}"></label>
    <label>${esc(t('email_addr'))}<input name="email" type="email" value="${esc(c.email || '')}"></label>
    <label>${esc(t('phone'))}<input name="phone" value="${esc(c.phone || '')}" dir="ltr"></label>
    ${compact ? '' : `
    <label>${esc(t('marital_status'))}<select name="marital_status">${enumOptions('marital_status', c.marital_status)}</select></label>
    <label>${esc(t('sons'))}<input name="sons" type="number" min="0" data-type="int" value="${c.sons ?? 0}"></label>
    <label>${esc(t('daughters'))}<input name="daughters" type="number" min="0" data-type="int" value="${c.daughters ?? 0}"></label>
    <label>${esc(t('total_children'))}<input id="kids" disabled value="${(c.sons || 0) + (c.daughters || 0)}"></label>`}
  </div></fieldset>
  <fieldset><legend>${esc(t('sec_location'))}</legend><div class="grid3">
    <label>${esc(t('inside_qatar'))}<select name="inside_qatar" data-type="bool">
      <option value=""></option><option value="true" ${c.inside_qatar === true ? 'selected' : ''}>${esc(t('yes'))}</option>
      <option value="false" ${c.inside_qatar === false ? 'selected' : ''}>${esc(t('no'))}</option></select></label>
    <label>${esc(t('residence_country'))}<input name="residence_country" value="${esc(c.residence_country || '')}"></label>
    <label>${esc(t('visa_status'))}<select name="visa_status">${enumOptions('visa_status', c.visa_status)}</select></label>
  </div></fieldset>
  <fieldset><legend>${esc(t('sec_professional'))}</legend><div class="grid3">
    <label class="span2">${esc(t('job_title'))}<select name="job_title_id" data-type="int">${titleOptions(c.job_title_id)}</select></label>
    <label id="specBox">${esc(t('specialization'))}<input name="specialization" list="spec-list" value="${esc(c.specialization || '')}"></label>
    <label id="labBox2" class="hidden">${esc(t('lab_or_spec'))}<select name="specialization" disabled>${labOptions(c.specialization || '')}</select></label>
    <label>${esc(t('cv_source'))}<select name="cv_source">${enumOptions('cv_source', c.cv_source)}</select></label>
    <label>${esc(t('cv_source_detail'))}<input name="cv_source_detail" value="${esc(c.cv_source_detail || '')}"></label>
    ${compact ? '' : `
    <label>${esc(t('qualification'))}<input name="qualification" value="${esc(c.qualification || '')}"></label>
    <label>${esc(t('years_experience'))}<input name="years_experience" type="number" min="0" step="0.5" data-type="num" value="${c.years_experience ?? ''}"></label>
    <label>${esc(t('current_employer'))}<input name="current_employer" value="${esc(c.current_employer || '')}"></label>
    <label>${esc(t('cv_url'))}<input name="cv_url" type="url" dir="ltr" value="${esc(c.cv_url || '')}" placeholder="https://"></label>`}
  </div></fieldset>
  ${compact ? '' : `
  <fieldset><legend>${esc(t('sec_placement'))}</legend><p class="muted" style="margin:0 0 .5rem">${esc(t('placement_hint'))}</p><div class="grid3">
    <label>${esc(t('school'))}<select name="school_id" data-type="int" ${lockedS ? 'disabled' : ''}>${options(visibleSchools(), c.school_id ?? lockedS, { empty: '' })}</select></label>
    <label>${esc(t('year'))}<select name="year_id" data-type="int">${options(ref.planYears, c.year_id ?? '', { empty: '', label: y => y.label })}</select></label>
    <div id="vac" class="vacancy-box" style="margin:0"></div>
  </div></fieldset>
  <label>${esc(t('notes'))}<textarea name="notes">${esc(c.notes || '')}</textarea></label>`}`;
}

// live behaviour: children total, specialisation suggestions, vacancy info
export function wireCandidateFields(root) {
  const ref = state.ref;
  const sons = root.querySelector('[name=sons]'), daughters = root.querySelector('[name=daughters]'), kids = root.querySelector('#kids');
  const upd = () => { if (kids) kids.value = (parseInt(sons.value || 0, 10) || 0) + (parseInt(daughters.value || 0, 10) || 0); };
  if (sons) { sons.oninput = upd; daughters.oninput = upd; }
  const title = root.querySelector('[name=job_title_id]'), school = root.querySelector('[name=school_id]');
  const inside = root.querySelector('[name=inside_qatar]'), country = root.querySelector('[name=residence_country]');
  if (inside) inside.onchange = () => { if (inside.value === 'true' && !country.value) country.value = state.lang === 'ar' ? 'قطر' : 'Qatar'; };
  const refresh = async () => {
    const tid = Number(title.value), sid = Number(school?.value || lockedSchool());
    const ti = ref.title[tid];
    // lab roles pick from the lab list; other roles type a free specialisation
    const lab = isLabTitle(tid), sb = root.querySelector('#specBox'), lb = root.querySelector('#labBox2');
    if (sb && lb) {
      const inp = sb.querySelector('input'), sel = lb.querySelector('select');
      if (lab && !lb.classList.contains('hidden')) { /* already lab */ } else if (lab) { sel.value = inp.value; }
      else if (!lb.classList.contains('hidden')) { inp.value = sel.value; }
      sb.classList.toggle('hidden', lab); lb.classList.toggle('hidden', !lab);
      inp.disabled = lab; sel.disabled = !lab;
    }
    void ti; void ref;
    const box = root.querySelector('#vac');
    if (!box) return;
    if (!tid || !sid) { box.innerHTML = `<span class="muted">${esc(t('remaining_for_title'))}: –</span>`; return; }
    try {
      const [r] = await db.list('v_position_status', { eq: { school_id: sid, job_title_id: tid } });
      box.innerHTML = r ? `<div class="big">${num(r.remaining)}</div><div><div>${esc(t('remaining_for_title'))}</div>${vacancyBadge(r.remaining)}
        <small> · ${esc(t('approved'))} ${num(r.approved_count)} · ${esc(t('current_staff'))} ${num(r.current_staff)} · ${esc(t('selected'))} ${num(r.selected)}</small></div>`
        : `<span class="muted">${esc(t('remaining_for_title'))}: 0</span>`;
    } catch (e) { box.textContent = ''; }
  };
  if (title) { title.addEventListener('change', refresh); if (school) school.addEventListener('change', refresh); refresh(); }
}

export function candidateValues(root) {
  const v = readForm(root);
  if (lockedSchool() && 'school_id' in v === false && root.querySelector('[name=school_id]')) v.school_id = lockedSchool();
  return v;
}

export function openCandidateForm(c = null, onDone) {
  modal({
    title: c ? t('edit_candidate') : t('new_candidate'), wide: true,
    body: `<div class="form">${candidateFields(c || {})}</div>`,
    onOpen: (w) => wireCandidateFields(w),
    onSave: async (w) => {
      if (!validate(w)) return false;
      const v = candidateValues(w);
      const saved = c ? await db.update('candidates', c.id, v) : await db.insert('candidates', v);
      toast(t('saved'));
      if (onDone) onDone(saved);
    },
  });
}
