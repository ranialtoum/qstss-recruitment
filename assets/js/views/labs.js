// Breakdown of per-lab job titles (Specialised Labs Engineer / Teacher) by specialised lab
import { state } from '../core.js';
import { LABS } from '../i18n.js';

export const HOLDS = ['accepted', 'offer_sent', 'offer_accepted', 'documents_complete', 'hired', 'started', 'probation_passed', 'confirmed'];
export const HIRED = ['hired', 'started', 'probation_passed', 'confirmed'];
export const JOINED = ['started', 'probation_passed', 'confirmed'];

const key = (s) => String(s || '').trim().toLowerCase();
const order = (name) => { const i = LABS.findIndex(l => key(l[0]) === key(name)); return i < 0 ? 99 : i; };

export const perLabTitles = () => state.ref.titles.filter(x => x.per_lab);
export const schoolLabs = (sid) => state.ref.labs.filter(l => l.school_id === sid)
  .sort((a, b) => order(a.name) - order(b.name) || a.name.localeCompare(b.name));

/**
 * Rows for one school × per-lab title.
 * parent: the v_position_status row; cands: candidates of that school+title; plan: v_plan_status rows of that school+title
 * Returns lab rows plus, when the totals don't reconcile, an "unassigned" row so the rows always add up to the parent.
 */
export function labRows(sid, parent, cands, plan, years) {
  const labs = schoolLabs(sid);
  const rows = labs.map(l => {
    const C = cands.filter(c => key(c.specialization) === key(l.name));
    const r = {
      name: l.name, lab: l, approved: l.approved_count ?? l.staff_count ?? 0, current: l.current_staff ?? 0,
      selected: C.filter(c => HOLDS.includes(c.stage)).length, hired: C.filter(c => HIRED.includes(c.stage)).length,
      joined: C.filter(c => JOINED.includes(c.stage)).length, years: {},
    };
    r.remaining = r.approved - r.current - r.selected;
    for (const y of years) {
      const P = plan.filter(p => p.year_id === y.id && key(p.specialization) === key(l.name));
      r.years[y.id] = { pl: P.reduce((a, x) => a + x.planned, 0), se: P.reduce((a, x) => a + x.selected, 0) };
    }
    return r;
  });
  if (parent) {
    const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
    const u = { name: null, unassigned: true, approved: parent.approved_count - sum('approved'), current: parent.current_staff - sum('current'),
      selected: parent.selected - sum('selected'), hired: parent.hired - sum('hired'), joined: parent.joined - sum('joined'), years: {} };
    u.remaining = parent.remaining - sum('remaining');
    let any = ['approved', 'current', 'selected', 'hired', 'joined', 'remaining'].some(k => u[k] !== 0);
    for (const y of years) {
      const all = plan.filter(p => p.year_id === y.id);
      const pl = all.reduce((a, x) => a + x.planned, 0) - rows.reduce((a, r) => a + r.years[y.id].pl, 0);
      const se = all.reduce((a, x) => a + x.selected, 0) - rows.reduce((a, r) => a + r.years[y.id].se, 0);
      u.years[y.id] = { pl, se };
      if (pl || se) any = true;
    }
    if (any && rows.length) rows.push(u);
  }
  return rows;
}
