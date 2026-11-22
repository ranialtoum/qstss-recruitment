-- =====================================================================
-- Update 07 (Nov 2026): only administrators may change the hiring plan.
-- (Vacancies — approved counts, staff and labs — were already admin-only.)
-- Everyone approved can still view both. Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
drop policy if exists "plan manage" on public.hiring_plan;
drop policy if exists "plan admin"  on public.hiring_plan;
create policy "plan admin" on public.hiring_plan for all
  using (public.is_admin()) with check (public.is_admin());

-- check: who can write to the vacancy and plan tables
select tablename, policyname, cmd, qual as allowed_when
from pg_policies
where schemaname = 'public' and tablename in ('hiring_plan', 'school_positions', 'school_labs') and cmd <> 'SELECT'
order by tablename;
