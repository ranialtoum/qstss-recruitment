// Interview record: candidate + role-specific rubric + holistic score /100 with colour-coded rating
import { db } from '../api.js';
import { state, t, en, esc, today, options, enumOptions, titleOptions, can, role, nm, titleName, visibleSchools,
  toast, fail, readForm, validate, ratingBadge, labOptions, isLabTitle, specLabel, panelOf, panelText, num } from '../core.js';
import { ratingFor, RATING_BANDS } from '../i18n.js';
import { candidateFields, wireCandidateFields, candidateValues, openCandidateForm } from './candidate_form.js';
import { GENERAL, Q_TYPES, subjectSetFor, setMax } from '../questions.js';

export async function render(el, ctx) {
  const ref = state.ref;
  const isNew = !ctx.id || ctx.id === 'new';
  if (isNew && !can('interview')) { location.hash = '#/interviews'; return; }

  let iv = null, cand = null;
  if (!isNew) {
    iv = await db.get('interviews', ctx.id);
    if (!iv) { el.innerHTML = `<div class="notice err">${esc(t('no_records'))}</div>`; return; }
    cand = await db.get('candidates', iv.candidate_id);
  } else if (ctx.params.candidate) {
    cand = await db.get('candidates', ctx.params.candidate);
  }
  const candidates = isNew && !cand ? await db.list('candidates', { select: 'id,ref_no,full_name,email,phone,nationality,job_title_id,specialization,cv_source,cv_source_detail,school_id,created_by' }) : [];
  if (!ctx.seq()) return;

  const editable = isNew || can('manage') || (role() === 'interviewer' && iv.created_by === state.profile.id);
  const v = iv || {
    interview_date: today(), job_title_id: cand?.job_title_id || '', source: cand?.cv_source || '', source_detail: cand?.cv_source_detail || '',
    school_id: cand?.school_id || '', scores: {}, criteria_notes: {}, result: 'pending',
    panel: [{ name: state.profile.full_name || '', title: state.profile.position_note || '' }],
  };
  let scores = { ...(v.scores || {}) };
  let notesBy = { ...(v.criteria_notes || {}) };
  // subject-mastery questions: { set: job title name, marks: {qid: n}, manual: number|null }
  let subj = { marks: {}, manual: null, ...((v.question_marks || {}).subject || {}) };
  let firstDraw = true;
  let overallTouched = v.overall_score !== null && v.overall_score !== undefined;
  let candMode = cand ? 'fixed' : 'existing';
  let picked = cand;

  el.innerHTML = `
    <div class="page-head"><div>
        <a href="${cand ? `#/candidate/${cand.id}` : '#/interviews'}" class="muted">← ${esc(cand ? cand.full_name : t('interview_list'))}</a>
        <h2 style="margin-top:.3rem">${esc(isNew ? t('new_interview') : t('edit_interview'))}</h2></div>
      <div class="row no-print"><button class="btn" onclick="window.print()">${esc(t('print_form'))}</button>
        ${!isNew && editable ? `<button class="btn danger" id="del">${esc(t('delete'))}</button>` : ''}</div></div>
    <form id="f" class="detail-grid" autocomplete="off">
      <div>
        <div class="card"><h3>${esc(t('choose_candidate'))}</h3><div id="cand"></div></div>
        <div class="card" id="det"><h3>${esc(t('interview'))}</h3>
          <div class="grid3">
            <label>${esc(t('interview_date'))} *<input type="date" name="interview_date" required value="${esc(v.interview_date)}"></label>
            <label class="span2">${esc(t('job_title'))} *<select name="job_title_id" data-type="int" required>${titleOptions(v.job_title_id)}</select></label>
            <label id="labBox" class="hidden">${esc(t('lab_or_spec'))} *<select id="lab">${labOptions(iv?.specialization || cand?.specialization || '')}</select></label>
            <label>${esc(t('source'))}<select name="source">${enumOptions('cv_source', v.source)}</select></label>
            <label>${esc(t('source_detail'))}<input name="source_detail" value="${esc(v.source_detail || '')}"></label>
            <label id="modeBox">${esc(t('mode'))}<select name="mode">${enumOptions('mode', v.mode)}</select></label>
            <label class="span2">${esc(t('recommended_school'))}<select name="school_id" data-type="int">${options(visibleSchools(), v.school_id, { empty: '' })}</select></label>
          </div>
          <div class="panel-box">
            <div class="row-between"><b>${esc(t('interviewers'))}</b>
              ${editable ? `<button type="button" class="btn small no-print" id="addPanel">＋ ${esc(t('add_interviewer'))}</button>` : ''}</div>
            <datalist id="panel-titles">${panelTitleOptions()}</datalist>
            <table class="panel-table"><thead><tr><th>${esc(t('panel_name'))}</th><th>${esc(t('panel_title'))}</th>
              <th class="print-only">${esc(t('signature'))}</th><th class="no-print"></th></tr></thead><tbody id="panelRows"></tbody></table>
          </div>
        </div>
        <div class="card"><div class="row-between"><h3>${esc(t('criteria'))}</h3><small class="muted" id="rubName"></small></div>
          <p class="muted" style="margin-top:0">${esc(t('scale_hint'))}</p>
          <div id="crit"></div></div>
        <div class="card">
          <div class="grid2">
            <label>${esc(t('strengths'))}<textarea name="strengths">${esc(v.strengths || '')}</textarea></label>
            <label>${esc(t('weaknesses'))}<textarea name="weaknesses">${esc(v.weaknesses || '')}</textarea></label>
            <label class="span2">${esc(t('general_notes'))}<textarea name="notes">${esc(v.notes || '')}</textarea></label>
          </div></div>
      </div>
      <div><div class="card score-panel">
        <h3>${esc(t('computed_score'))}</h3>
        <div class="row-between"><div class="score-big" id="comp">–</div><small class="muted" id="compN"></small></div>
        <hr style="border:0;border-top:1px solid var(--line);margin:1rem 0">
        <h3>${esc(t('overall_score'))}</h3>
        <div class="row"><input type="number" min="0" max="100" step="1" name="overall_score" data-type="num" id="ov" style="width:100px;font-size:1.4rem;font-weight:700" value="${v.overall_score ?? ''}">
          <span id="ovBadge"></span></div>
        <input type="range" min="0" max="100" step="1" id="ovr" value="${v.overall_score ?? 0}" style="margin:.6rem 0">
        <button type="button" class="btn small" id="useComp">${esc(t('use_computed'))}</button>
        <div class="rating-legend" style="margin-top:.8rem">${RATING_BANDS.map((b, i) => `<span class="rating rating-${b.key}">${esc(en('rating', b.key))} ${i === 0 ? '≥ 90' : `${b.min}–${RATING_BANDS[i - 1].min - 1}`}</span>`).join('')}</div>
        <hr style="border:0;border-top:1px solid var(--line);margin:1rem 0">
        <h3>${esc(t('interview_result'))}</h3>
        <div class="seg">${['accepted', 'reserve', 'rejected', 'pending'].map(r => `<label><input type="radio" name="result" value="${r}" ${v.result === r ? 'checked' : ''}>${esc(en('result', r))}</label>`).join('')}</div>
        <label class="check" id="assignBox" style="margin-top:.8rem"><input type="checkbox" id="assign" checked> ${esc(t('assign_on_accept'))}</label>
        <label id="yearBox" style="margin-top:.5rem">${esc(t('year'))}<select id="assignYear">${options(ref.planYears, cand?.year_id || ref.currentYear?.id, { label: y => y.label })}</select></label>
        ${editable ? `<button class="btn primary block" style="margin-top:1rem" id="save">${esc(t('save'))}</button>` : ''}
      </div></div>
    </form>`;

  const form = el.querySelector('#f');
  const $ = (s) => form.querySelector(s);

  // ---- candidate block ----
  const canEditCand = (c) => !!c && (can('manage') || (role() === 'interviewer' && c.created_by === state.profile.id));
  function drawCand() {
    const box = $('#cand');
    if (candMode === 'fixed' && picked) {
      box.innerHTML = `<div class="row-between"><div><b>${esc(picked.full_name)}</b> <small class="muted">#${picked.ref_no}</small>
        <div class="muted">${esc([titleName(picked.job_title_id), specLabel(picked.specialization), picked.nationality, picked.email, picked.phone].filter(Boolean).join(' · '))}</div></div>
        <span class="row no-print">${canEditCand(picked) ? `<button type="button" class="btn small" id="edc">${esc(t('edit_candidate'))}</button>` : ''}
        ${isNew && !ctx.params.candidate ? `<button type="button" class="btn small" id="chg">${esc(t('choose_candidate'))} ↺</button>` : ''}</span></div>`;
      const chg = box.querySelector('#chg'); if (chg) chg.onclick = () => { candMode = 'existing'; picked = null; drawCand(); };
      const edc = box.querySelector('#edc');
      if (edc) edc.onclick = async () => { const full = await db.get('candidates', picked.id); openCandidateForm(full, (saved) => { picked = saved; drawCand(); }); };
      return;
    }
    box.innerHTML = `<div class="seg" style="margin-bottom:.75rem">
        <label><input type="radio" name="_cm" value="existing" ${candMode === 'existing' ? 'checked' : ''}>${esc(t('existing_candidate'))}</label>
        <label><input type="radio" name="_cm" value="new" ${candMode === 'new' ? 'checked' : ''}>${esc(t('create_new_candidate'))}</label></div>
      <div id="cm"></div>`;
    box.querySelectorAll('[name=_cm]').forEach(r => r.onchange = () => { candMode = r.value; drawCand(); });
    const cm = box.querySelector('#cm');
    if (candMode === 'existing') {
      cm.innerHTML = `<div class="rel"><input id="q" placeholder="${esc(t('search_candidate'))}"><div class="suggest hidden" id="sg"></div></div>`;
      const q = cm.querySelector('#q'), sg = cm.querySelector('#sg');
      q.oninput = () => {
        const s = q.value.trim().toLowerCase();
        const hits = s.length < 2 ? [] : candidates.filter(c => [c.full_name, c.email, c.phone, String(c.ref_no)].some(x => (x || '').toLowerCase().includes(s))).slice(0, 12);
        sg.classList.toggle('hidden', !hits.length);
        sg.innerHTML = hits.map(c => `<div data-id="${c.id}"><b>${esc(c.full_name)}</b> <small class="muted">#${c.ref_no} · ${esc([titleName(c.job_title_id), c.nationality].filter(Boolean).join(' · '))}</small></div>`).join('');
        sg.querySelectorAll('[data-id]').forEach(d => d.onclick = () => {
          picked = candidates.find(c => c.id === d.dataset.id); candMode = 'fixed';
          if (picked.job_title_id && !$('[name=job_title_id]').value) { $('[name=job_title_id]').value = picked.job_title_id; drawCrit(); }
          if (picked.specialization && !$('#lab').value) $('#lab').value = picked.specialization;
          if (picked.cv_source && !$('[name=source]').value) { $('[name=source]').value = picked.cv_source; $('[name=source_detail]').value = picked.cv_source_detail || ''; toggleMode(); }
          drawCand();
        });
      };
      q.focus();
    } else {
      cm.innerHTML = `<div class="form" id="newc">${candidateFields({}, { compact: true })}</div>`;
      const jt = cm.querySelector('[name=job_title_id]'); if (jt) jt.closest('label').remove();
      toggleLab();
      wireCandidateFields(cm);
      const src = cm.querySelector('[name=cv_source]');
      src.onchange = () => { $('[name=source]').value = src.value; toggleMode(); };
      cm.querySelector('[name=cv_source_detail]').oninput = (e) => { $('[name=source_detail]').value = e.target.value; };
    }
  }

  // ---- criteria ----
  function criteriaFor(tid) {
    const ti = ref.title[tid];
    if (!ti) return [];
    // an existing interview keeps the rubric it was scored with, even if the title's rubric changed later
    const rk = (!isNew && iv.rubric_key && tid === iv.job_title_id && Object.keys(iv.scores || {}).length) ? iv.rubric_key : ti.rubric_key;
    return ref.criteria.filter(c => c.active !== false && ((rk && c.rubric_key === rk) || c.job_title_id === ti.id));
  }
  function toggleLab() {
    const lab = isLabTitle(Number($('[name=job_title_id]').value));
    $('#labBox').classList.toggle('hidden', !lab);
    $('#lab').required = lab;
    const sp = form.querySelector('#newc [name=specialization]');
    if (sp) sp.closest('label').classList.toggle('hidden', lab);
  }
  function drawCrit() {
    toggleLab();
    const tid = Number($('[name=job_title_id]').value);
    const crit = criteriaFor(tid);
    const ti = ref.title[tid];
    const rk = (!isNew && iv.rubric_key && tid === iv.job_title_id && Object.keys(iv.scores || {}).length) ? iv.rubric_key : ti?.rubric_key;
    $('#rubName').textContent = rk ? `${t('rubric')}: ${nm(ref.rubric[rk])} · ${en('category', ti.category)}` : '';
    const set = rk === 'teacher' && crit.some(c => c.key === 'subject') ? subjectSetFor(ti) : null;
    syncSubjectSet(set, ti);
    const general = GENERAL[rk] || {};
    $('#crit').innerHTML = crit.length ? crit.map(c => `<div class="crit" data-k="${esc(c.key)}">
        <div class="crit-head"><div><b>${esc(nm(c))}</b> <span class="w">${esc(t('weight'))} ${c.weight}%</span>
          ${(state.lang === 'ar' ? c.hint_ar : c.hint_en) ? `<div class="crit-hint">${esc(state.lang === 'ar' ? c.hint_ar : c.hint_en)}</div>` : ''}</div>
          ${c.key === 'subject' && set ? `<div class="subj-badge" id="subjBadge"></div>`
            : `<div class="scale">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" class="${Number(scores[c.key]) === n ? 'on' : ''}" ${editable ? '' : 'disabled'}>${n}</button>`).join('')}</div>`}</div>
        ${c.key === 'subject' && set ? subjectHtml(set) : generalHtml(general[c.key])}
        <input class="crit-note" placeholder="${esc(t('note'))}" value="${esc(notesBy[c.key] || '')}" ${editable ? '' : 'disabled'}></div>`).join('')
      : `<div class="empty">${esc(t('pick_title_first'))}</div>`;
    if (set) wireSubject(set);
    $('#crit').querySelectorAll('.crit').forEach(box => {
      const k = box.dataset.k;
      box.querySelectorAll('.scale:not(.qscale) [data-n]').forEach(b => b.onclick = () => {
        scores[k] = Number(scores[k]) === Number(b.dataset.n) ? undefined : Number(b.dataset.n);
        if (scores[k] === undefined) delete scores[k];
        box.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', Number(x.dataset.n) === scores[k]));
        calc();
      });
      box.querySelector('.crit-note').oninput = (e) => { notesBy[k] = e.target.value; };
    });
    calc();
  }

  // ---- interview questions ----
  const L = (pair) => (state.lang === 'ar' ? pair[1] : pair[0]);
  const qtag = (type) => `<span class="qtag qtag-${type}">${esc(L(Q_TYPES[type]))}</span>`;
  function generalHtml(list) {
    if (!list || !list.length) return '';
    return `<details class="qs"><summary>${esc(t('suggested_questions'))} (${list.length})</summary><ol>
      ${list.map(q => `<li>${q.scenario ? qtag('scenario') : ''} ${esc(state.lang === 'ar' ? q.ar : q.en)}</li>`).join('')}</ol></details>`;
  }
  const round2 = (x) => Math.round(x * 100) / 100;
  const marksSum = (set) => set.questions.reduce((a, q) => a + (Number(subj.marks[q.id]) || 0), 0);
  const anyMarks = (set) => set.questions.some(q => subj.marks[q.id] !== undefined);
  const subjFinal = (set) => (subj.manual !== null && subj.manual !== undefined ? subj.manual : anyMarks(set) ? marksSum(set) : null);
  // keep the stored question set in line with the chosen job title
  function syncSubjectSet(set, ti) {
    const name = set ? ti.name_en : null;
    if (firstDraw) {
      firstDraw = false;
      // older interview scored 1–5 without questions: show it as a manual score out of the set's maximum
      if (set && !subj.set && !Object.keys(subj.marks).length && scores.subject !== undefined) { subj.set = name; subj.manual = round2(scores.subject / 5 * setMax(set)); }
    }
    if ((subj.set || null) === name) return;
    if (subj.set) delete scores.subject;   // the title changed: the old questions no longer apply
    subj = { set: name, marks: {}, manual: null };
  }
  function subjectHtml(set) {
    const max = setMax(set), dir = set.lang === 'ar' ? 'rtl' : 'ltr';
    return `<p class="muted" style="margin:.4rem 0 .2rem;font-size:.82rem">${esc(t('subject_q_hint'))}</p>
      ${set.questions.map((q, i) => { const m = q.a.length; return `<div class="sq" data-q="${q.id}">
        <div class="sq-head"><div class="sq-text"><div>${qtag(q.type)}${q.scenario ? ` ${qtag("scenario")}` : ""} <b>${esc(t("question"))} ${i + 1}</b> <span class="muted">· ${m} ${esc(t('marks'))}</span></div>
          <div lang="${set.lang}" dir="${dir}">${esc(q.q)}</div></div>
          <div class="scale qscale">${Array.from({ length: m + 1 }, (_, n) => `<button type="button" data-n="${n}" class="${subj.marks[q.id] === n ? 'on' : ''}" ${editable ? '' : 'disabled'}>${n}</button>`).join('')}</div></div>
        <details class="model"><summary>${esc(t('model_answer'))} <span class="muted">(${esc(t('mark_per_point'))})</span></summary>
          <ol lang="${set.lang}" dir="${dir}">${q.a.map(p => `<li>${esc(p)}</li>`).join('')}</ol></details></div>`; }).join('')}
      <div class="subj-total">
        <label>${esc(t('subject_score'))}<span class="row"><input type="number" id="subjScore" min="0" max="${max}" step="0.5" ${editable ? '' : 'disabled'}> <b>/ ${max}</b></span></label>
        <div><div class="muted" id="subjCalc"></div><span id="subjManual"></span>
          ${editable ? `<button type="button" class="btn small no-print" id="subjReset">${esc(t('use_questions_total'))}</button>` : ''}</div>
      </div>
      ${state.ref.ivQ === false && can('admin') ? `<div class="notice" style="margin-top:.5rem">${esc(t('q_db_update'))}</div>` : ''}`;
  }
  function wireSubject(set) {
    const box = $('#crit').querySelector('.crit[data-k="subject"]');
    const max = setMax(set), inp = box.querySelector('#subjScore');
    const refresh = () => {
      const sum = marksSum(set), fin = subjFinal(set);
      if (fin === null) delete scores.subject; else scores.subject = round2(fin / max * 5);
      if (document.activeElement !== inp) inp.value = fin ?? '';
      box.querySelector('#subjCalc').textContent = `${t('from_questions')}: ${num(sum)} / ${max} (${set.questions.filter(q => subj.marks[q.id] !== undefined).length} / ${set.questions.length})`;
      const manual = subj.manual !== null && subj.manual !== undefined;
      box.querySelector('#subjManual').innerHTML = manual ? `<span class="badge tone-amber">${esc(t('manually_adjusted'))}</span> ` : '';
      const rs = box.querySelector('#subjReset'); if (rs) rs.classList.toggle('hidden', !manual);
      $('#subjBadge').innerHTML = fin === null ? '<span class="muted">–</span>' : `<b>${num(fin)}</b> / ${max}`;
      calc();
    };
    box.querySelectorAll('.sq').forEach(row => {
      const id = row.dataset.q;
      row.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
        const n = Number(b.dataset.n);
        if (subj.marks[id] === n) delete subj.marks[id]; else subj.marks[id] = n;
        row.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', Number(x.dataset.n) === subj.marks[id]));
        refresh();
      });
    });
    inp.oninput = () => {
      if (inp.value === '') subj.manual = null;
      else subj.manual = Math.max(0, Math.min(max, Number(inp.value)));
      refresh();
    };
    inp.onchange = () => { inp.value = subjFinal(set) ?? ''; };
    const rs = box.querySelector('#subjReset');
    if (rs) rs.onclick = () => { subj.manual = null; inp.value = subjFinal(set) ?? ''; refresh(); };
    refresh();
  }
  window.addEventListener('beforeprint', () => el.querySelectorAll('details').forEach(d => { d.open = true; }));

  function computed() {
    const crit = criteriaFor(Number($('[name=job_title_id]').value));
    let w = 0, s = 0, n = 0;
    crit.forEach(c => { if (scores[c.key] !== undefined && scores[c.key] !== null) { w += Number(c.weight); s += Number(c.weight) * scores[c.key] / 5; n++; } });
    return { score: w ? Math.round((s / w) * 100) : null, n, total: crit.length };
  }
  function calc() {
    const c = computed();
    $('#comp').textContent = c.score ?? '–';
    $('#compN').textContent = `${c.n} / ${c.total}`;
    if (!overallTouched && c.score !== null) { $('#ov').value = c.score; $('#ovr').value = c.score; }
    showRating();
  }
  function showRating() {
    const val = $('#ov').value;
    $('#ovBadge').innerHTML = val === '' ? '' : ratingBadge(null, ratingFor(Number(val)));
    const res = form.querySelector('[name=result]:checked')?.value;
    const show = res === 'accepted' && editable;
    $('#assignBox').classList.toggle('hidden', !show);
    $('#yearBox').classList.toggle('hidden', !show);
  }
  function toggleMode() { $('#modeBox').classList.toggle('hidden', !['school', ''].includes($('[name=source]').value) && !$('[name=mode]').value); }

  $('[name=job_title_id]').onchange = drawCrit;
  $('[name=source]').onchange = toggleMode;
  $('#ov').oninput = () => { overallTouched = true; $('#ovr').value = $('#ov').value || 0; showRating(); };
  $('#ovr').oninput = () => { overallTouched = true; $('#ov').value = $('#ovr').value; showRating(); };
  $('#useComp').onclick = () => { const c = computed(); if (c.score !== null) { $('#ov').value = c.score; $('#ovr').value = c.score; overallTouched = false; showRating(); } };
  form.querySelectorAll('[name=result]').forEach(r => r.onchange = showRating);
  // ---- interview panel ----
  const panelRow = (p = {}) => `<tr><td><input class="p-name" value="${esc(p.name || '')}" placeholder="${esc(t('panel_name'))}" ${editable ? '' : 'disabled'}></td>
    <td><input class="p-title" list="panel-titles" value="${esc(p.title || '')}" placeholder="${esc(t('panel_title'))}" ${editable ? '' : 'disabled'}></td>
    <td class="print-only sig"></td>
    <td class="no-print">${editable ? `<button type="button" class="icon-btn p-rm" title="${esc(t('delete'))}">✕</button>` : ''}</td></tr>`;
  const wirePanel = () => $('#panelRows').querySelectorAll('.p-rm').forEach(b => b.onclick = () => { b.closest('tr').remove(); if (!$('#panelRows').children.length) addPanel(); });
  const addPanel = (p) => { $('#panelRows').insertAdjacentHTML('beforeend', panelRow(p)); wirePanel(); };
  const initial = panelOf(v);
  (initial.length ? initial : [{}]).forEach(addPanel);
  if ($('#addPanel')) $('#addPanel').onclick = () => { addPanel(); $('#panelRows').lastElementChild.querySelector('.p-name').focus(); };
  const readPanel = () => [...$('#panelRows').querySelectorAll('tr')].map(tr => ({ name: tr.querySelector('.p-name').value.trim(), title: tr.querySelector('.p-title').value.trim() })).filter(p => p.name);

  drawCand(); drawCrit(); toggleMode();
  if (!editable) form.querySelectorAll('input,select,textarea,button').forEach(x => { if (!x.closest('.no-print')) x.disabled = true; });

  form.onsubmit = (e) => e.preventDefault();
  const saveBtn = $('#save');
  if (saveBtn) saveBtn.onclick = async () => {
    const det = $('#det');
    if (!validate(det)) return;
    if (candMode === 'existing' && !picked) { toast(`${t('choose_candidate')}: ${t('required')}`, 'err'); return; }
    if (candMode === 'new' && !validate($('#newc'))) return;
    saveBtn.disabled = true;
    try {
      const d = readForm(det);
      const ov = $('#ov').value;
      const result = form.querySelector('[name=result]:checked')?.value || 'pending';
      const tid = d.job_title_id;
      const lab = isLabTitle(tid) ? $('#lab').value : '';
      let candidate = picked;
      if (candMode === 'new') {
        const cv = candidateValues($('#newc'));
        candidate = await db.insert('candidates', { ...cv, job_title_id: tid, ...(lab ? { specialization: lab } : {}) });
      }
      const c = computed();
      const crit = criteriaFor(tid).map(x => x.key);
      const row = {
        ...d, candidate_id: candidate.id, rubric_key: ref.title[tid]?.rubric_key || null,
        scores: Object.fromEntries(Object.entries(scores).filter(([k]) => crit.includes(k))),
        criteria_notes: Object.fromEntries(Object.entries(notesBy).filter(([k, val]) => crit.includes(k) && val)),
        computed_score: c.score, overall_score: ov === '' ? null : Math.max(0, Math.min(100, Number(ov))),
        strengths: form.querySelector('[name=strengths]').value || null, weaknesses: form.querySelector('[name=weaknesses]').value || null,
        notes: form.querySelector('[name=notes]').value || null, result, updated_at: new Date().toISOString(),
      };
      if (ref.ivLab) row.specialization = lab || null;   // the database copies it to the candidate
      const panel = readPanel();
      row.interviewers = panelText(panel) || null;
      if (ref.ivPanel) row.panel = panel;
      if (ref.ivQ) row.question_marks = subj.set ? { subject: { set: subj.set, marks: subj.marks, manual: subj.manual ?? null } } : {};
      if (isNew) await db.insert('interviews', row); else await db.update('interviews', iv.id, row);
      const patch = {};
      if (!ref.ivLab && candMode !== 'new' && lab && lab !== candidate.specialization) patch.specialization = lab;
      if (result === 'accepted' && $('#assign').checked) {
        patch.job_title_id = tid; patch.year_id = Number($('#assignYear').value) || null;
        if (d.school_id) patch.school_id = d.school_id;
      }
      if (Object.keys(patch).length) {
        try { await db.update('candidates', candidate.id, patch); } catch (err) { toast(err.message, 'err'); }
      }
      toast(t('interview_saved'));
      location.hash = `#/candidate/${candidate.id}`;
    } catch (err) { fail(err); } finally { saveBtn.disabled = false; }
  };
  const del = el.querySelector('#del');
  if (del) del.onclick = async () => {
    if (!confirm(t('confirm_delete'))) return;
    try { await db.remove('interviews', iv.id); location.hash = `#/candidate/${iv.candidate_id}`; } catch (e) { fail(e); }
  };
}

// suggestions for panel members' job titles: leadership roles + all job titles in the system
function panelTitleOptions() {
  const extra = state.lang === 'ar'
    ? ['المدير الأكاديمي', 'مدير الموارد البشرية', 'أخصائي توظيف', 'ممثل الوزارة']
    : ['Academic Director', 'HR Manager', 'Recruitment Specialist', 'Ministry Representative'];
  const names = [...extra, ...state.ref.titles.map(x => nm(x))];
  return [...new Set(names)].map(n => `<option value="${esc(n)}">`).join('');
}
