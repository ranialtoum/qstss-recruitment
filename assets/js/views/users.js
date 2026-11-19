import { db } from '../api.js';
import { state, t, en, esc, fmtDate, options, schoolName, toast, fail, nm } from '../core.js';

const ROLES = ['admin', 'hr', 'interviewer', 'principal', 'viewer'];

export async function render(el, ctx) {
  const users = await db.list('profiles', { order: [['created_at', false]] });
  if (!ctx.seq()) return;
  const pending = users.filter(u => u.status === 'pending');
  const others = users.filter(u => u.status !== 'pending');
  const me = state.profile.id;

  const roleSel = (u, def) => `<select data-role="${u.id}" ${u.id === me ? 'disabled' : ''}>${ROLES.map(r => `<option value="${r}" ${(u.role !== 'none' ? u.role : def) === r ? 'selected' : ''}>${esc(en('role', r))}</option>`).join('')}</select>`;
  const schoolSel = (u, def) => `<select data-school="${u.id}" ${u.id === me ? 'disabled' : ''}>${options(state.ref.schools, u.school_id ?? def, { empty: '—' })}</select>`;

  el.innerHTML = `
    <div class="page-head"><div><h2>${esc(t('users_title'))}</h2><p>${esc(t('role_help'))}</p></div></div>
    <div class="card"><h3>${esc(t('pending_requests'))} <span class="badge tone-amber">${pending.length}</span></h3>
      ${pending.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('full_name'))}</th><th>${esc(t('position_note'))}</th><th>${esc(t('requested'))}</th>
        <th>${esc(t('role'))}</th><th>${esc(t('school'))}</th><th>${esc(t('registered'))}</th><th></th></tr></thead><tbody>
        ${pending.map(u => `<tr><td><b>${esc(u.full_name || '')}</b><span class="cell-sub">${esc(u.email || '')} ${u.phone ? '· ' + esc(u.phone) : ''}</span></td>
          <td><small>${esc(u.position_note || '')}</small></td>
          <td><small>${esc(en('role', u.requested_role))}${u.requested_school_id ? ' · ' + esc(schoolName(u.requested_school_id)) : ''}</small></td>
          <td>${roleSel(u, u.requested_role || 'viewer')}</td><td>${schoolSel(u, u.requested_school_id)}</td><td><small>${fmtDate(u.created_at)}</small></td>
          <td class="row"><button class="btn primary small" data-approve="${u.id}">${esc(t('approve'))}</button>
            <button class="btn small danger" data-reject="${u.id}">${esc(t('reject'))}</button></td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty">${esc(t('no_records'))}</div>`}
    </div>
    <div class="card"><h3>${esc(t('nav_users'))}</h3>
      <div class="table-wrap"><table><thead><tr><th>${esc(t('full_name'))}</th><th>${esc(t('role'))}</th><th>${esc(t('school'))}</th><th>${esc(t('status'))}</th>
        <th>${esc(t('registered'))}</th><th></th></tr></thead><tbody>
        ${others.map(u => `<tr><td><b>${esc(u.full_name || '')}</b> ${u.id === me ? `<span class="badge tone-blue">${esc(t('you'))}</span>` : ''}<span class="cell-sub">${esc(u.email || '')}</span></td>
          <td>${roleSel(u, 'viewer')}</td><td>${schoolSel(u)}</td>
          <td><span class="badge tone-${{ approved: 'green', rejected: 'red', disabled: 'grey' }[u.status]}">${esc(en('user_status', u.status))}</span></td>
          <td><small>${fmtDate(u.created_at)}</small></td>
          <td class="row">${u.id === me ? '' : `<button class="btn small" data-save="${u.id}">${esc(t('save'))}</button>
            ${u.status === 'approved' ? `<button class="btn small danger" data-disable="${u.id}">${esc(t('disable'))}</button>` : `<button class="btn small" data-approve="${u.id}">${esc(t('enable'))}</button>`}`}</td></tr>`).join('')}
      </tbody></table></div></div>`;

  const val = (id) => {
    const r = el.querySelector(`[data-role="${id}"]`).value, s = el.querySelector(`[data-school="${id}"]`).value;
    return { role: r, school_id: s ? Number(s) : null };
  };
  const upd = async (id, patch) => {
    if (patch.role === 'principal' && !patch.school_id) { toast(t('school_required'), 'err'); return; }
    try { await db.update('profiles', id, patch); toast(t('saved')); render(el, ctx); } catch (e) { fail(e); }
  };
  el.querySelectorAll('[data-approve]').forEach(b => b.onclick = () => upd(b.dataset.approve, { ...val(b.dataset.approve), status: 'approved' }));
  el.querySelectorAll('[data-save]').forEach(b => b.onclick = () => upd(b.dataset.save, val(b.dataset.save)));
  el.querySelectorAll('[data-reject]').forEach(b => b.onclick = () => upd(b.dataset.reject, { status: 'rejected', role: 'none' }));
  el.querySelectorAll('[data-disable]').forEach(b => b.onclick = () => upd(b.dataset.disable, { status: 'disabled' }));
  void nm;
}
