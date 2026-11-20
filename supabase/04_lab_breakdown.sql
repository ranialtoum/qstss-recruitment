-- =====================================================================
-- Update 04 (Nov 2026): needed number and staff per specialised lab.
-- The approved total for "Specialised Labs Engineer / Teacher" in each
-- school becomes the sum of its labs. Run once in Supabase → SQL Editor.
-- Safe to run again (it does not overwrite numbers already entered).
-- =====================================================================
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'school_labs' and column_name = 'approved_count') then
    alter table public.school_labs add column approved_count int not null default 0 check (approved_count >= 0);
    alter table public.school_labs add column current_staff  int not null default 0 check (current_staff  >= 0);
    -- first run only: needed number = figure from the workbook where given, otherwise 1 per lab
    update public.school_labs set approved_count = case when coalesce(staff_count, 0) > 0 then staff_count else 1 end;
  end if;
end $$;

alter table public.job_titles add column if not exists per_lab boolean not null default false;
update public.job_titles set per_lab = true where name_ar = 'مهندس / معلم المختبرات التخصصية';

-- align lab names with the standard list used in interviews
update public.school_labs set name = trim(name) where name <> trim(name);
update public.school_labs set name = 'STEM Lab' where name = 'STEM';
update public.school_labs set name = 'VR & AR'  where name in ('VR &AR', 'VR&AR', 'VR& AR');

-- keep the title's approved total = sum of the school's labs
create or replace function public.sync_lab_totals() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid int := coalesce(new.school_id, old.school_id);
begin
  if exists (select 1 from public.school_labs where school_id = sid) then
    update public.school_positions sp
       set approved_count = (select coalesce(sum(approved_count), 0) from public.school_labs where school_id = sid),
           updated_at = now()
      from public.job_titles j
     where sp.job_title_id = j.id and j.per_lab and sp.school_id = sid;
  end if;
  return null;
end $$;

drop trigger if exists school_labs_sync on public.school_labs;
create trigger school_labs_sync after insert or update or delete on public.school_labs
  for each row execute function public.sync_lab_totals();

-- apply now to every school that has labs
update public.school_positions sp
   set approved_count = t.total, updated_at = now()
  from (select school_id, sum(approved_count) total from public.school_labs group by school_id) t,
       public.job_titles j
 where sp.school_id = t.school_id and sp.job_title_id = j.id and j.per_lab;

-- result
select s.name_en as school, count(l.id) as labs, coalesce(sum(l.approved_count), 0) as needed_total
from public.schools s left join public.school_labs l on l.school_id = s.id
group by s.id, s.sort order by s.sort;
